import { NestFactory } from '@nestjs/core';
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
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
