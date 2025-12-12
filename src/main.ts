import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { LoggingInterceptor } from './interceptors/logging.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 设置全局前缀（可选）
  // app.setGlobalPrefix('api');

  // 启用CORS
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // 应用全局日志拦截器
  app.useGlobalInterceptors(new LoggingInterceptor());

  await app.listen(8083);
  console.log('服务器启动在端口 8083');
}
void bootstrap();
