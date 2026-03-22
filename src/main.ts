import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3000);
  const apiPrefix = configService.get<string>('API_PREFIX', 'api/v1');
  const corsOrigin = configService.get<string>('CORS_ORIGIN', 'http://localhost:3001');

  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      crossOriginEmbedderPolicy: false,
    }),
  );

  app.use(cookieParser());

  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads',
  });

  app.enableCors({
    origin: (origin, callback) => {
      const allowedOrigins = new Set(
        String(corsOrigin)
          .split(',')
          .map((o) => o.trim())
          .filter(Boolean),
      );

      allowedOrigins.add('http://localhost:3001');
      allowedOrigins.add('http://192.168.0.127:3001');

      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.has(origin)) {
        return callback(null, true);
      }

      console.log('❌ CORS bloqueou origem:', origin);
      return callback(new Error(`CORS bloqueado para origin: ${origin}`), false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Cookie',
      'X-Requested-With',
      'Accept',
      'Origin',
    ],
    exposedHeaders: ['Set-Cookie'],
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });

  app.setGlobalPrefix(apiPrefix);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Sindaval API')
    .setDescription('Sistema SaaS para Sindicato de Advogados')
    .setVersion('1.0')
    .addTag('auth', 'Autenticação')
    .addTag('users', 'Usuários')
    .addTag('admin', 'Administração')
    .addTag('payments', 'Pagamentos')
    .addTag('benefits', 'Benefícios')
    .addTag('notifications', 'Notificações')
    .addTag('reports', 'Relatórios')
    .addTag('digital-card', 'Carteira Digital')
    .addTag('public', 'Endpoints Públicos')
    .addCookieAuth('jwt')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(port, '0.0.0.0');
  console.log(`🚀 Aplicação rodando em: http://localhost:${port}/${apiPrefix}`);
  console.log(`📚 Documentação Swagger: http://localhost:${port}/api/docs`);
}

bootstrap();
