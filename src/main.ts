import './config/loadEnv';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';
import { ensureDatabaseUrl } from './config/resolvePostgresUri';

async function bootstrap() {
  await ensureDatabaseUrl();

  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.useStaticAssets(join(__dirname, '..', 'public-web'), {
    prefix: '/public/',
    index: false,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: { enableImplicitConversion: true },
    })
  );

  const config = app.get(ConfigService);
  const corsOrigin = config.get<string>('corsOrigin') || 'http://localhost:3000';

  app.enableCors({
    origin: corsOrigin.split(',').map((o) => o.trim()),
    credentials: true,
  });

  const port = config.get<number>('port') || 4341;
  app.enableShutdownHooks();
  await app.listen(port);
  console.log(`🚀 FormFlow na porta ${port}`);
}

bootstrap().catch((error) => {
  console.error('❌ FormFlow falhou ao iniciar:', error);
  process.exit(1);
});
