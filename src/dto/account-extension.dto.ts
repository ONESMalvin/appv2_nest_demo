export interface CustomLoginUrlRequest {
  org_uuid: string;
  redirect_url: string;
}

export interface CustomLoginUrlResponse {
  login_url: string;
}

export interface AuthLoginInfoRequest {
  org_uuid: string;
  auth_info: string;
}

export interface AuthLoginInfoResponse {
  third_party_user_id: string;
  name?: string;
  email?: string;
  avatar?: string;
  phone?: string;
  title?: string;
  id_number?: string;
  company?: string;
  department_ids?: string[];
  corp_id?: string;
}

export interface DirectorySyncRequest {
  org_uuid: string;
}

export interface DirectoryDepartment {
  third_party_department_id: string;
  name: string;
  parent_id: string;
  next_id: string;
}

export interface DirectoryUser {
  third_party_user_id: string;
  name?: string;
  email?: string;
  avatar?: string;
  phone?: string;
  title?: string;
  id_number?: string;
  company?: string;
  department_ids?: string[];
  corp_id?: string;
}

export interface DirectorySyncResponse {
  users: Record<string, DirectoryUser>;
  departments: Record<string, DirectoryDepartment>;
}

export interface MessageNotifyRequest {
  org_uuid: string;
  to_users: string[];
  message_data: {
    context?: {
      team_uuid?: string;
      project_uuid?: string;
      task_uuids?: string[];
    };
    title: string;
    desc: string;
    url: string;
  };
}

export type MessageNotifyResponse = Record<string, unknown>;

export interface HelpInfoRequest {
  org_uuid: string;
  language: string;
}

export interface HelpInfoResponse {
  title: string;
  desc: string;
  config_tip?: string;
  detail_tip?: string;
}
