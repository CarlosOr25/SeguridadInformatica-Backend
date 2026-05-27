import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // CORS abierto: el cliente es una app de escritorio Electron (origin file://
  // en producción y http://localhost:xxxx en desarrollo).
  app.enableCors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  });

  // Activa las validaciones globales
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Ignora datos extra que el frontend envíe por error
      forbidNonWhitelisted: true, // Lanza error si envían datos prohibidos
    }),
  );

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
