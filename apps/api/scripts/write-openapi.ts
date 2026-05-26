import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from '../src/app.module';

async function writeOpenApiDocument() {
  const outputPath = resolve(
    process.cwd(),
    process.env.OPENAPI_OUTPUT ?? '/tmp/live-every-day-openapi.json',
  );
  const app = await NestFactory.create(AppModule, { logger: false });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Live Every Day API')
    .setDescription('API documentation')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);

  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, JSON.stringify(document, null, 2));
  await app.close();
}

writeOpenApiDocument().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
