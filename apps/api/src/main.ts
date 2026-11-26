import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { json, urlencoded } from 'express';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
const compression = require('compression');

async function bootstrap() {
  const logger = new Logger('ollaiBooksAPI');
  const app = await NestFactory.create(AppModule, { rawBody: true });

  // High-performance gzip/brotli compression to prevent network lag under 1M scale
  app.use(compression());

  // Prevent memory exhaustion attacks with explicit body limits
  app.use(json({ limit: '10mb' }));
  app.use(urlencoded({ extended: true, limit: '10mb' }));

  // Graceful shutdown handling for container orchestrators (SIGTERM, SIGINT)
  app.enableShutdownHooks();

  const allowedOrigins = (process.env.CORS_ORIGINS || process.env.FRONTEND_URL || 'http://localhost:3000')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
  });

  // Global All-Exceptions filter to catch unhandled errors and prevent server crashes
  app.useGlobalFilters(new AllExceptionsFilter());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );

  // OpenAPI Swagger Documentation
  const config = new DocumentBuilder()
    .setTitle('ollaiBooks AI API')
    .setDescription('Enterprise Multi-Tenant SaaS Billing, Orders & AI Automation Backend API')
    .setVersion('1.0')
    .addBearerAuth()
    .addApiKey({ type: 'apiKey', name: 'x-tenant-id', in: 'header' }, 'x-tenant-id')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 4000;
  await app.listen(port);
  logger.log(`🚀 ollaiBooks AI API is running on: http://localhost:${port}/api/v1`);
  logger.log(`📖 Swagger API Docs available at: http://localhost:${port}/api/docs`);
  logger.log(`🩺 Health check endpoint: http://localhost:${port}/api/v1/health`);
}

bootstrap();
