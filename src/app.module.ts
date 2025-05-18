import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { InfrastructureModule } from './infrastructure/infrastructure.module';
import { CoreModule } from './core/core.module';
import { ModulesModule } from './resources/resources.module';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import * as winston from 'winston';
import { RedisModule } from '@nestjs-modules/ioredis';
import {
  utilities as nestWinstonModuleUtilities,
  WinstonModule,
} from 'nest-winston';
import { RedisModule } from '@liaoliaots/nestjs-redis';

@Module({
  imports: [
    InfrastructureModule,
    CoreModule,
    ModulesModule,
    ConfigModule.forRoot({ isGlobal: true }),
    BullModule.forRoot({
      connection: {
        host: 'localhost',
        port: 6379,
        db:1
      },
    }),
    RedisModule.forRoot({
      config: {
        host: 'localhost',
        port: 6379,
        password: '12345678',
      },
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
