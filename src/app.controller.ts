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
import { AccountThirdpartyService } from './services/account_thirdparty.service';
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
  DirectorySyncRequest,
  DirectorySyncResponse,
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
    private accountThirdpartyService: AccountThirdpartyService,
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

    const language = requestBody.language || 'en';
    const returnEntries: SettingPageEntriesResponse = {
      entries: [
        {
          title: language === 'zh' ? '组织团队信息' : 'Organization Team Info',
          page_url: '/static/setting_page_1.html',
        },
        {
          title: language === 'zh' ? 'Web SDK Demo' : 'Web SDK Demo',
          page_url: '/static/web_sdk_demo.html',
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
      return this.accountThirdpartyService.generateLoginUrl(request);
    } catch {
      throw new HttpException('生成登录链接失败', HttpStatus.BAD_REQUEST);
    }
  }

  @Post('/account/authInfo')
  handleAccountAuthInfo(
    @Body() request: AuthLoginInfoRequest,
  ): AuthLoginInfoResponse {
    return this.accountThirdpartyService.getAuthInfo(request);
  }

  @Post('/account/directorySync')
  handleAccountDirectorySync(
    @Body() request: DirectorySyncRequest,
  ): DirectorySyncResponse {
    return this.accountThirdpartyService.syncDirectory(request);
  }

  @Post('/account/messageNotify')
  handleAccountMessageNotify(
    @Body() request: MessageNotifyRequest,
  ): MessageNotifyResponse {
    return this.accountThirdpartyService.handleMessageNotify(request);
  }

  @Post('/account/helpInfo')
  async handleAccountHelpInfo(
    @Body() request: HelpInfoRequest,
  ): Promise<HelpInfoResponse> {
    return this.accountThirdpartyService.getHelpInfo(request);
  }

  @Get('/account/logo')
  getAccountLogo(@Res() res: Response) {
    const svg = this.accountThirdpartyService.getLogo();
    res.setHeader('Content-Type', 'image/svg+xml');
    res.send(svg);
  }
}
