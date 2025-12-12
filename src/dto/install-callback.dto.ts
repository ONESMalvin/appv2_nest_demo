export class AppInfo {
  id: string;
  version: string;
}

export class InstallCallbackReq {
  installation_id: string;
  org_id: string;
  ones_base_url: string;
  shared_secret: string;
  callback_type: string;
  time_stamp: number;
  app?: AppInfo;
}

export class InstallCallbackResp {
  installation_id: string;
  time_stamp: number;
}

export class JWTClaims {
  iss: string; // 发行者 (ones_base_url)
  sub: string; // 受众 (installation_id)
  aud: string; // 受众 (app_id)
  exp: number; // 过期时间
  iat: number; // 签发时间
  uid: string; // 用户ID
}

export class JWTAssertionClaim {
  uid: string; // 用户ID
  rsh: string; // 请求hash
  iss: string;
  sub: string;
  aud: string;
  exp: number;
  iat: number;
}

export class ONESEventAppV2 {
  eventID: string;
  eventType: string;
  eventData: any;
  timestamp: number;
  subscriberID: string;
}

export class ManhourOptions {
  scene: string;
}

export class ManhourRequest {
  type: string; // 预估、登记、剩余工时分类
  action: string; // add、update、delete
  mode: string;
  options: ManhourOptions;
}

export class Entry {
  title: string; // 设置项标题
  page_url: string; // 设置项页面链接
}

export class SettingPageEntryRequest {
  user_uuid: string; // 用户UUID
  language: string; // 语言
  timezone: string; // 时区
}

export class SettingPageEntriesResponse {
  entries: Entry[];
}

import { Request } from 'express';

// 扩展的 Request 接口，包含中间件添加的属性
export interface AuthenticatedRequest extends Request {
  installation_id: string;
  uid: string;
  ones_url: string;
}
