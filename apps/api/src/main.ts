import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

const localDevOriginPattern =
  /^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\]|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+)(:\d+)?$/;

function parseCsvEnv(name: string) {
  return (process.env[name] ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);
}

function parseCorsOrigins() {
  const configuredOrigins = parseCsvEnv('CORS_ORIGIN');
  const developmentOrigins =
    process.env.NODE_ENV === 'production'
      ? []
      : [
          'http://localhost:3001',
          'http://localhost:8081',
          'http://localhost:19006',
          'http://127.0.0.1:3001',
          'http://127.0.0.1:8081',
          'http://127.0.0.1:19006',
        ];
  const allowedOrigins = new Set([...configuredOrigins, ...developmentOrigins]);

  return (origin: string | undefined, callback: (error: Error | null, allow?: boolean) => void) => {
    if (!origin || allowedOrigins.has(origin) || (process.env.NODE_ENV !== 'production' && localDevOriginPattern.test(origin))) {
      callback(null, true);
      return;
    }

    callback(null, false);
  };
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: parseCorsOrigins(),
    credentials: true,
  });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Live Every Day API')
    .setDescription('API documentation')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);

  SwaggerModule.setup('api/docs', app, document);
  app.getHttpAdapter().get('/api/openapi.json', (_req, res) => {
    res.json(document);
  });

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
