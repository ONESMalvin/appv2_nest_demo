import { Injectable, Logger } from '@nestjs/common';
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

@Injectable()
export class AccountThirdpartyService {
  private readonly logger = new Logger(AccountThirdpartyService.name);

  /**
   * 生成自定义登录 URL
   */
  generateLoginUrl(request: CustomLoginUrlRequest): CustomLoginUrlResponse {
    try {
      const redirectUrl = new URL(request.redirect_url);
      redirectUrl.searchParams.set('third_party_token', 'mock-token');
      redirectUrl.searchParams.set('org', request.org_uuid);

      return { login_url: redirectUrl.toString() };
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
   * 获取认证信息
   */
  getAuthInfo(request: AuthLoginInfoRequest): AuthLoginInfoResponse {
    return {
      third_party_user_id: `tp_${request.auth_info}`,
      name: 'Test User',
      email: 'test.user@example.com',
      avatar: 'https://avatars.githubusercontent.com/u/0?v=4',
      phone: '+86 13800000000',
      title: 'Demo Account',
      company: 'ThirdParty Inc.',
      department_ids: ['dept_root'],
      corp_id: request.org_uuid,
    };
  }

  /**
   * 目录同步
   */
  syncDirectory(request: DirectorySyncRequest): DirectorySyncResponse {
    const departments: Record<string, DirectoryDepartment> = {
      dept_root: {
        third_party_department_id: 'dept_root',
        name: '研发中心',
        parent_id: '0',
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

    return { users, departments };
  }

  /**
   * 消息通知
   */
  handleMessageNotify(request: MessageNotifyRequest): MessageNotifyResponse {
    this.logger.log(
      `accountThirdparty messageNotify org=${request.org_uuid}, to=${request.to_users.join(',')}, title=${request.message_data.title}`,
    );

    return {};
  }

  /**
   * 获取帮助信息
   */
  async getHelpInfo(request: HelpInfoRequest): Promise<HelpInfoResponse> {
    const language = request.language || 'en';
    const isZh = language.toLowerCase().startsWith('zh');

    await new Promise((resolve) => setTimeout(resolve, 5000));
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
