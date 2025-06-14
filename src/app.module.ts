import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { InfrastructureModule } from './infrastructure/infrastructure.module';
import { CoreModule } from './core/core.module';
import { ModulesModule } from './resources/resources.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import * as winston from 'winston';
import { RedisModule } from '@nestjs-modules/ioredis';
import {
  utilities as nestWinstonModuleUtilities,
  WinstonModule,
} from 'nest-winston';
import { ScheduleModule } from '@nestjs/schedule';
import { MailerModule } from '@nestjs-modules/mailer';
import { join } from 'path';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
console.log("REDIS_HOST:", process.env.REDIS_HOST);
console.log("REDIS_PORT:", process.env.REDIS_PORT);
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: process.env.NODE_ENV === 'production'
        ? '.env.production'
        : '.env.development',
      expandVariables: true,
    }),
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (cfg: ConfigService) => ({
        transport: {
          host: cfg.get('SMTP_HOST'),
          port: cfg.get<number>('SMTP_PORT'),
          secure: cfg.get('SMTP_SECURE'),
          auth: {
            user: cfg.get('SMTP_USER'),
            pass: cfg.get('SMTP_PASS'),
          },
        },
        defaults: {
          from: `"No Reply" <${cfg.get('SMTP_FROM')}>`,
        },
        template: {
          dir: join(__dirname, '/templates/emails'),
          adapter: new HandlebarsAdapter(),
          options: { strict: true },
        },
      }),
      inject: [ConfigService],
    }),
    InfrastructureModule,
    ScheduleModule.forRoot(),
    CoreModule,
    ModulesModule,
    ConfigModule.forRoot({ isGlobal: true }),
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
        db:1
      },
    }),
    RedisModule.forRoot({
      type: 'single', // Specify connection type
      url: `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}/0`, // Direct URL configuration
      
      // OR for cluster:
      // nodes: [{ host: 'localhost', port: 6379 }],
      // options: { clusterEnabled: true }
    }),
    WinstonModule.forRoot({
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.ms(),
            nestWinstonModuleUtilities.format.nestLike('Winston Log', {
              colors: true,
              prettyPrint: true,
            }),
          ),
        }),
      ],
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
