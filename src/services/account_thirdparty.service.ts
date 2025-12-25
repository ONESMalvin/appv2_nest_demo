import { Injectable, Logger } from '@nestjs/common';
import { readFileSync } from 'fs';
import { join } from 'path';
import {
  CustomLoginUrlRequest,
  CustomLoginUrlResponse,
  AuthLoginInfoRequest,
  AuthLoginInfoResponse,
  DirectorySyncRequest,
  DirectorySyncResponse,
  DirectoryDepartment,
  DirectoryUser,
  MessageNotifyRequest,
  MessageNotifyResponse,
  HelpInfoRequest,
  HelpInfoResponse,
} from '../dto/account-extension.dto';

interface ManifestConfig {
  id: string;
  base_url?: string;
  [key: string]: unknown;
}

@Injectable()
export class AccountThirdpartyService {
  private readonly logger = new Logger(AccountThirdpartyService.name);

  /**
   * 生成自定义登录 URL
   */
  generateLoginUrl(request: CustomLoginUrlRequest): CustomLoginUrlResponse {
    try {
      /**
       * 这里返回的是“自定义登录页面”的地址，而不是直接跳回 redirect_url。
       * 自定义页面打包后会放在插件静态资源里：/static/login.html
       *
       * 登录页逻辑：
       *  - 从查询参数中读取 redirect_url、org_uuid
       *  - 用户输入名字前缀并点击“登录”
       *  - 页面把 auth_info=用户输入 的参数附加到 redirect_url 上并跳转
       *  - 平台随后会调用 /account/authInfo，后端在 getAuthInfo 中完成前缀匹配并返回用户信息
       */
      const baseUrl = this.getAppBaseUrl();
      // 以应用的 base_url 为基础，拼出静态页面地址
      const loginPageUrl = new URL(join(baseUrl, '/static/login.html'));
      // 清空原有查询参数，只保留我们需要传递给登录页的参数
      loginPageUrl.search = '';
      console.log('request:', request);
      loginPageUrl.searchParams.set('redirect_url', request.redirect_url);
      loginPageUrl.searchParams.set('org_uuid', request.org_uuid);

      console.log('loginPageUrl', loginPageUrl.toString());
      return { login_url: loginPageUrl.toString() };
    } catch (error) {
      this.logger.error(
        `生成登录链接失败: ${
          error instanceof Error ? error.message : '未知错误'
        }`,
      );
      throw error;
    }
  }

  /**
   * 获取应用的 base_url，逻辑与 AppController.resolveBaseUrl 保持一致
   */
  private getAppBaseUrl(): string {
    const manifestPath = join(process.cwd(), 'manifest.json');
    const manifestData = readFileSync(manifestPath, 'utf8');
    const manifest = JSON.parse(manifestData) as ManifestConfig;

    const envBaseUrl = process.env.ONES_BASE_URL;
    if (envBaseUrl) {
      return envBaseUrl;
    }

    const envHost = process.env.ONES_HOST;
    if (envHost) {
      const hostWithProtocol = envHost.startsWith('http')
        ? envHost
        : `https://${envHost}`;

      return new URL(
        `/platform/plugin_relay/app_dispatch/${manifest.id}`,
        hostWithProtocol,
      ).toString();
    }

    if (typeof manifest.base_url === 'string') {
      return manifest.base_url;
    }

    throw new Error('manifest.base_url is missing');
  }

  /**
   * 获取认证信息
   */
  getAuthInfo(request: AuthLoginInfoRequest): AuthLoginInfoResponse {
    /**
     * 约定：
     *  - login.html 页面会把用户在输入框中输入的“名字前缀”作为 code 传回
     *  - 这里根据前缀在目录同步返回的 users 中查找匹配的用户
     *  - 找到则认为认证成功，返回该用户信息；找不到则抛错
     */
    console.log('request', request);
    const requestAuth = JSON.parse(request.auth_info) as { code: string };
    const prefix = (requestAuth.code || '').trim().toLowerCase();
    if (!prefix) {
      throw new Error('code 不能为空');
    }

    // 复用目录同步里的用户数据，保证账号和目录一致
    const { users } = this.syncDirectory({ org_uuid: request.org_uuid });
    const allUsers = Object.values(users);

    const matched = allUsers.find((user) => {
      const name = (user.name || '').toLowerCase();
      return name.startsWith(prefix);
    });

    if (!matched) {
      throw new Error(`未找到以「${request.auth_info}」为前缀的用户`);
    }

    return {
      third_party_user_id: matched.third_party_user_id,
      name: matched.name,
      email: matched.email,
      avatar: matched.avatar,
      phone: matched.phone,
      title: matched.title,
      id_number: matched.id_number,
      company: matched.company,
      department_ids: matched.department_ids,
      corp_id: request.org_uuid,
    };
  }

  /**
   * 目录同步
   */
  syncDirectory(request: DirectorySyncRequest): DirectorySyncResponse {
    const departments: Record<string, DirectoryDepartment> = {
      // 根部门，id 必须为 "-1"
      '-1': {
        third_party_department_id: '-1',
        name: 'Root Department',
        parent_id: '0',
        next_id: '',
      },
      // 子部门挂在根部门下
      dept_root: {
        third_party_department_id: 'dept_root',
        name: '研发中心',
        parent_id: '-1',
        next_id: '',
      },
      dept_fe: {
        third_party_department_id: 'dept_fe',
        name: '前端组',
        parent_id: 'dept_root',
        next_id: '',
      },
    };

    const users: Record<string, DirectoryUser> = {
      tp_alice: {
        third_party_user_id: 'tp_alice',
        name: 'Alice Zhang',
        email: 'alice@example.com',
        title: '前端开发',
        department_ids: ['dept_fe'],
        corp_id: request.org_uuid,
      },
      tp_bob: {
        third_party_user_id: 'tp_bob',
        name: 'Bob Li',
        email: 'bob@example.com',
        title: '项目经理',
        department_ids: ['dept_root'],
        corp_id: request.org_uuid,
      },
    };
    console.log('data:', { users, departments });

    return { users, departments };
  }

  /**
   * 消息通知
   */
  handleMessageNotify(request: MessageNotifyRequest): MessageNotifyResponse {
    this.logger.log(
      `accountThirdparty messageNotify ${JSON.stringify(request)}`
    );

    return {};
  }

  /**
   * 获取帮助信息
   */
  async getHelpInfo(request: HelpInfoRequest): Promise<HelpInfoResponse> {
    const language = request.language || 'en';
    const isZh = language.toLowerCase().startsWith('zh');

    await new Promise((resolve) => setTimeout(resolve, 50));
    return {
      title: isZh ? '测试账号提供商' : 'Test Account Provider',
      desc: isZh
        ? '用于演示第三方账号接入的测试 Provider'
        : 'Demo provider for third-party account integration',
      config_tip: isZh
        ? '无需真实认证，按照提示完成配置即可'
        : 'No real auth needed; follow prompts to configure.',
      detail_tip: isZh
        ? '点击登录会跳转回 redirect_url，并返回模拟用户信息。目录同步与消息通知返回固定示例数据。'
        : 'Login redirects back to redirect_url with mock user info. Directory sync and notifications return fixed sample data.',
    };
  }

  /**
   * 获取账号 Logo (SVG)
   */
  getLogo(): string {
    return `
<svg width="120" height="120" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#4F46E5"/>
      <stop offset="100%" stop-color="#22D3EE"/>
    </linearGradient>
  </defs>
  <rect rx="18" ry="18" width="120" height="120" fill="url(#g)"/>
  <circle cx="40" cy="60" r="18" fill="#fff" opacity="0.9"/>
  <circle cx="80" cy="60" r="18" fill="#fff" opacity="0.9"/>
  <path d="M34 60c0-12 8-22 20-24 12-2 24 6 26 18" stroke="#0F172A" stroke-width="8" stroke-linecap="round" fill="none"/>
</svg>`.trim();
  }
}
