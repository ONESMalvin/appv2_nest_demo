import { Injectable } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { DatabaseService } from './database.service';
import {
  JWTClaims,
  JWTAssertionClaim,
  InstallCallbackReq,
} from '../dto/install-callback.dto';

@Injectable()
export class AuthService {
  constructor(private databaseService: DatabaseService) {}

  async verifyJWT(tokenString: string): Promise<JWTClaims> {
    try {
      const decoded = jwt.decode(tokenString) as JWTClaims;
      if (!decoded) {
        throw new Error('Invalid token');
      }

      const installationID = decoded.sub;
      const installInfo =
        await this.databaseService.getInstallation(installationID);
      if (!installInfo) {
        throw new Error('Installation not found');
      }

      const validKey = Buffer.from(installInfo.shared_secret, 'base64');
      const verified = jwt.verify(tokenString, validKey) as JWTClaims;

      return verified;
    } catch (error) {
      throw new Error(
        `JWT验证失败: ${error instanceof Error ? error.message : '未知错误'}`,
      );
    }
  }

  extractTokenFromHeader(authHeader: string): string {
    if (!authHeader) {
      throw new Error('Authorization header为空');
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      throw new Error('Authorization header格式错误，应为: Bearer <token>');
    }

    return parts[1];
  }

  async validateRequestAuth(authHeader: string): Promise<JWTClaims> {
    const tokenString = this.extractTokenFromHeader(authHeader);
    const claims = await this.verifyJWT(tokenString);
    return claims;
  }

  genJWTAssertion(
    installationInfo: InstallCallbackReq,
    userID: string,
  ): string {
    const payload: JWTAssertionClaim = {
      uid: userID,
      rsh: '',
      iss: installationInfo.installation_id,
      sub: installationInfo.installation_id,
      aud: 'oauth',
      exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60, // 24小时后过期
      iat: Math.floor(Date.now() / 1000),
    };

    const signKey = Buffer.from(installationInfo.shared_secret, 'base64');
    return jwt.sign(payload, signKey, { algorithm: 'HS256' });
  }
}
