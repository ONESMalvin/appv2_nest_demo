import { Injectable } from '@nestjs/common';
import { AuthService } from './auth.service';
import { InstallCallbackReq } from '../dto/install-callback.dto';

interface TokenResponse {
  access_token: string;
  token_type: string;
  email: string;
  expires_in: number;
  refresh_token: string;
  scope: string;
  user_id: string;
}

@Injectable()
export class OpenApiService {
  constructor(private authService: AuthService) {}

  private async getAccessToken(
    installationInfo: InstallCallbackReq,
    userID: string,
  ): Promise<string> {
    const tokenString = this.authService.genJWTAssertion(
      installationInfo,
      userID,
    );

    const onesUrl = new URL(installationInfo.ones_base_url);
    const tokenUrl = new URL('/oauth2/token', onesUrl);

    const formData = new URLSearchParams();
    formData.set('grant_type', 'client_credentials');
    formData.set('client_assertion', tokenString);
    formData.set('client_id', installationInfo.installation_id);
    formData.set(
      'client_assertion_type',
      'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
    );

    const response = await fetch(tokenUrl.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    if (!response.ok) {
      throw new Error(`Failed to get access token: ${response.statusText}`);
    }

    const token = (await response.json()) as TokenResponse;
    return token.access_token;
  }

  async callONESOpenAPI(
    installationInfo: InstallCallbackReq,
    userID: string,
    api: string,
    method: string,
    body?: unknown,
  ): Promise<unknown> {
    const accessToken = await this.getAccessToken(installationInfo, userID);

    const onesUrl = new URL(installationInfo.ones_base_url);
    const apiUrl = new URL(`/openapi/v2${api}`, onesUrl);

    const requestOptions: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
    };

    if (body) {
      requestOptions.body = JSON.stringify(body);
    }

    const response = await fetch(apiUrl.toString(), requestOptions);

    if (!response.ok) {
      throw new Error(`OpenAPI call failed: ${response.statusText}`);
    }

    return await response.json();
  }
}
