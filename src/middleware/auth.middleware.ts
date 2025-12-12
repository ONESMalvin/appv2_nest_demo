import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { AuthenticatedRequest } from '../dto/install-callback.dto';

@Injectable()
export class JWTAuthMiddleware implements NestMiddleware {
  constructor(private authService: AuthService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedException('缺少Authorization header');
    }

    try {
      const claims = await this.authService.validateRequestAuth(authHeader);

      // 将claims信息存储到请求对象中，供后续处理函数使用
      (req as AuthenticatedRequest).installation_id = claims.sub;
      (req as AuthenticatedRequest).uid = claims.uid;
      (req as AuthenticatedRequest).ones_url = claims.iss;

      next();
    } catch (error) {
      console.log(
        'JWT验证失败: ',
        error instanceof Error ? error.message : '未知错误',
      );
      throw new UnauthorizedException(
        `JWT验证失败: ${error instanceof Error ? error.message : '未知错误'}`,
      );
    }
  }
}
