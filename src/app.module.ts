import { Module, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseService } from './services/database.service';
import { AuthService } from './services/auth.service';
import { OpenApiService } from './services/openapi.service';
import { InstallCallback } from './entities/install-callback.entity';
import { JWTAuthMiddleware } from './middleware/auth.middleware';
import { CORSMiddleware } from './middleware/cors.middleware';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: './appv2.db',
      entities: [InstallCallback],
      synchronize: true,
    }),
    TypeOrmModule.forFeature([InstallCallback]),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'web', 'dist'),
      serveRoot: '/static',
    }),
  ],
  controllers: [AppController],
  providers: [AppService, DatabaseService, AuthService, OpenApiService],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(CORSMiddleware)
      .forRoutes('*')
      .apply(JWTAuthMiddleware)
      .forRoutes(
        { path: '/manhour/validate', method: RequestMethod.POST },
        { path: '/uninstall_cb', method: RequestMethod.POST },
        { path: '/enabled_cb', method: RequestMethod.POST },
        { path: '/disabled_cb', method: RequestMethod.POST },
      );
  }
}
