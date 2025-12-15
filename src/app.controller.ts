import {
  Controller,
  Get,
  Post,
  Body,
  Req,
  Res,
  HttpStatus,
  HttpCode,
  HttpException,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { readFileSync } from 'fs';
import { join } from 'path';
import { DatabaseService } from './services/database.service';
import { OpenApiService } from './services/openapi.service';
import {
  InstallCallbackReq,
  InstallCallbackResp,
  ONESEventAppV2,
  ManhourRequest,
  SettingPageEntryRequest,
  SettingPageEntriesResponse,
  AuthenticatedRequest,
} from './dto/install-callback.dto';
import {
  AuthLoginInfoRequest,
  AuthLoginInfoResponse,
  CustomLoginUrlRequest,
  CustomLoginUrlResponse,
  DirectoryDepartment,
  DirectorySyncRequest,
  DirectorySyncResponse,
  DirectoryUser,
  HelpInfoRequest,
  HelpInfoResponse,
  MessageNotifyRequest,
  MessageNotifyResponse,
} from './dto/account-extension.dto';

interface ManifestConfig {
  id: string;
  base_url?: string;
  [key: string]: unknown;
}

@Controller()
export class AppController {
  private eventMap = new Map<string, number>();
  private readonly logger = new Logger(AppController.name);

  // Allow overriding manifest base_url via environment for different ONES hosts
  private resolveBaseUrl(manifest: ManifestConfig): string {
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

  constructor(
    private databaseService: DatabaseService,
    private openApiService: OpenApiService,
  ) {}

  @Get('/')
  getManifest(@Res() res: Response) {
    try {
      const manifestPath = join(process.cwd(), 'manifest.json');
      const manifestData = readFileSync(manifestPath, 'utf8');
      const manifest = JSON.parse(manifestData) as ManifestConfig;

      manifest.base_url = this.resolveBaseUrl(manifest);

      res.setHeader('Content-Type', 'application/json');
      res.send(JSON.stringify(manifest, null, 2));
    } catch {
      throw new HttpException(
        '无法读取manifest文件',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('/manifest')
  getManifestEndpoint(@Res() res: Response) {
    this.getManifest(res);
  }

  @Post('/install_cb')
  async handleInstallCB(
    @Body() requestBody: InstallCallbackReq,
    @Res() res: Response,
  ) {
    this.logger.log(`收到安装回调请求: ${requestBody.installation_id}`);

    try {
      await this.databaseService.saveInstallCallback(requestBody);
      this.logger.log(`安装回调信息已保存: ${requestBody.installation_id}`);

      const response: InstallCallbackResp = {
        installation_id: requestBody.installation_id,
        time_stamp: Math.floor(Date.now() / 1000),
      };

      this.logger.log(`安装回调响应: ${JSON.stringify(response)}`);
      res.status(HttpStatus.OK).send(response);
    } catch (error) {
      this.logger.error(
        `安装回调失败: ${error instanceof Error ? error.message : '未知错误'}`,
      );
      throw new HttpException(
        `保存数据失败: ${error instanceof Error ? error.message : '未知错误'}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('/uninstall_cb')
  handleUninstallCB(@Res() res: Response) {
    res.status(HttpStatus.OK).send({ status: 'success', message: '请求成功' });
  }

  @Post('/enabled_cb')
  handleEnabledCB(@Res() res: Response) {
    console.log('收到enabled_cb');
    res.status(HttpStatus.OK).send({ status: 'success', message: '请求成功' });
  }

  @Post('/disabled_cb')
  handleDisabledCB(@Res() res: Response) {
    res.status(HttpStatus.OK).send({ status: 'success', message: '请求成功' });
  }

  @Get('/all_installations')
  async getAllInstallations() {
    try {
      return await this.databaseService.getAllInstallations();
    } catch {
      throw new HttpException(
        '获取安装信息失败',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('/manhour/validate')
  async handleManhourValidate(
    @Body() requestBody: ManhourRequest,
    @Req() req: AuthenticatedRequest,
  ) {
    try {
      const installationID = req.installation_id;
      const userID = req.uid;

      const installInfo =
        await this.databaseService.getInstallation(installationID);
      if (!installInfo) {
        throw new HttpException(
          '获取安装信息失败',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      const body = await this.openApiService.callONESOpenAPI(
        installInfo,
        userID,
        '/project/issues?teamID=6SpShEhb',
        'GET',
        null,
      );

      console.log('调用OPENAPI返回:', JSON.stringify(body));

      return {
        error: {
          reason: '不准提交工时！',
          level: 'error',
        },
      };
    } catch (error) {
      throw new HttpException(
        `调用OPENAPI失败: ${error instanceof Error ? error.message : '未知错误'}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('/events/webhook')
  @HttpCode(200)
  handleEvents(@Body() requestBody: ONESEventAppV2, @Req() req: Request) {
    const auth = req.headers.authorization;
    const eventId = req.headers['x-ones-event-id'] as string;
    const eventType = req.headers['x-ones-event-type'] as string;

    console.log(
      `auth: [${auth}], eventId: [${eventId}], eventType: [${eventType}], subscriberId: [${requestBody.subscriberID}]`,
    );

    if (eventType === 'ones:events:health') {
      return { status: 'success', message: '请求成功' };
    }

    const currentCount = this.eventMap.get(requestBody.subscriberID) || 0;
    this.eventMap.set(requestBody.subscriberID, currentCount + 1);
    console.log(
      `eventMap[${requestBody.subscriberID}]: ${this.eventMap.get(requestBody.subscriberID)}`,
    );

    console.log('事件内容:', requestBody);
    return { status: 'success', message: '请求成功' };
  }

  @Get('/oauth/callback')
  handleOauthCallback(@Req() req: Request) {
    const code = req.query.code as string;
    const installationID = req.query.installation_id as string;
    console.log(`收到oauth回调: ${code}, ${installationID}`);
    return {
      status: 'success',
      message: '请求成功',
      code,
      installation_id: installationID,
    };
  }

  @Post('/settingPage/entries')
  handleSettingPageEntries(@Body() requestBody: SettingPageEntryRequest) {
    console.log('请求 /settingPage/entries, header:', requestBody);

    const returnEntries: SettingPageEntriesResponse = {
      entries: [
        {
          title: requestBody.language === 'zh' ? '测试' : 'Test',
          page_url: '/static/page1.html',
        },
      ],
    };

    return returnEntries;
  }

  @Post('/account/loginUrl')
  handleAccountLoginUrl(
    @Body() request: CustomLoginUrlRequest,
  ): CustomLoginUrlResponse {
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
      throw new HttpException('生成登录链接失败', HttpStatus.BAD_REQUEST);
    }
  }

  @Post('/account/authInfo')
  handleAccountAuthInfo(
    @Body() request: AuthLoginInfoRequest,
  ): AuthLoginInfoResponse {
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

  @Post('/account/directorySync')
  handleAccountDirectorySync(
    @Body() request: DirectorySyncRequest,
  ): DirectorySyncResponse {
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

  @Post('/account/messageNotify')
  handleAccountMessageNotify(
    @Body() request: MessageNotifyRequest,
  ): MessageNotifyResponse {
    this.logger.log(
      `accountThirdparty messageNotify org=${request.org_uuid}, to=${request.to_users.join(',')}, title=${request.message_data.title}`,
    );

    return {};
  }

  @Post('/account/helpInfo')
  handleAccountHelpInfo(@Body() request: HelpInfoRequest): HelpInfoResponse {
    const language = request.language || 'en';
    const isZh = language.toLowerCase().startsWith('zh');

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

  @Get('/account/logo')
  getAccountLogo(@Res() res: Response) {
    const svg = `
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
</svg>`;

    res.setHeader('Content-Type', 'image/svg+xml');
    res.send(svg.trim());
  }
}
