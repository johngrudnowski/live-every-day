import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

function parseCorsOrigins() {
  const origins = (process.env.CORS_ORIGIN ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);

  return origins.length > 0 ? origins : true;
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
