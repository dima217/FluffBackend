import 'tsconfig-paths/register';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from '@infrastructure/app.module';
import type { AppConfig } from '@config';
import { Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { networkInterfaces } from 'os';
import * as express from 'express';
import { SwaggerJsonFilter } from '@infrastructure/filters/swagger-json.filter';
import { ViewCacheService } from '@infrastructure/service/view-cache.service';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
    bodyParser: false,
  });

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Enable CORS
  app.enableCors({
    origin: ['http://localhost:3001', 'http://localhost:3002', 'http://localhost:4000', 'http://127.0.0.1:3001', 'http://127.0.0.1:3002', 'http://127.0.0.1:4000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  });

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('Constructor Auth API')
    .setDescription('Authentication API for Constructor application')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addCookieAuth('refreshToken')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  app.getHttpAdapter().get('/api-json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(document);
  });

  app.useGlobalFilters(new SwaggerJsonFilter(document));

  const configService = app.get<ConfigService<AppConfig>>(ConfigService);
  const appConfig = configService.get<AppConfig>('app', { infer: true });
  const port = appConfig?.port ?? 3000;
  await app.listen(port, '0.0.0.0');

  // Get local network IP address
  const nets = networkInterfaces();
  const localIPs: string[] = [];
  for (const name of Object.keys(nets)) {
    for (const net of nets[name] || []) {
      if (net.family === 'IPv4' && !net.internal) {
        localIPs.push(net.address);
      }
    }
  }

  logger.log(`Application is running on: http://localhost:${port}`);
  if (localIPs.length > 0) {
    logger.log(`Access from other devices on your network:`);
    localIPs.forEach((ip) => {
      logger.log(`  - http://${ip}:${port}`);
    });
  }
  logger.log(`Swagger documentation available at: http://localhost:${port}/api`);

  // Initialize admin stats view
  try {
    const viewCacheService = app.get(ViewCacheService);
    if (viewCacheService) {
      await viewCacheService.initializeView();
    }
  } catch (error) {
    logger.warn('Failed to initialize admin stats view:', error);
  }
}
void bootstrap();
