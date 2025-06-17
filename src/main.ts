import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as dotenv from 'dotenv';

// const envFile =
//   process.env.NODE_ENV === 'production'
//     ? '.env.production'
//     : '.env.development';
// dotenv.config({ path: envFile });

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  console.log("REDIS_HOST:", process.env.REDIS_HOST);
  console.log("REDIS_PORT:", process.env.REDIS_PORT);
  // Configure CORS
  app.enableCors({
    origin: process.env.FRONTEND_URL || '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Accept, Authorization, X-Requested-With',
    exposedHeaders: 'Authorization',
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });

  const config = new DocumentBuilder()
    .setTitle('pass-final-year-project')
    .setDescription('The pass-final-year-project API description')
    .setVersion('1.0')
    .addTag('pass-final-year-project')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
      'JWT-auth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
}

bootstrap();
