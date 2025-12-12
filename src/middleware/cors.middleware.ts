import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class CORSMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // 设置CORS头
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', '*');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header(
      'Access-Control-Allow-Methods',
      'GET, POST, PUT, DELETE, OPTIONS',
    );

    // 处理OPTIONS预检请求
    if (req.method === 'OPTIONS') {
      res.status(204).end();
      return;
    }

    next();
  }
}
