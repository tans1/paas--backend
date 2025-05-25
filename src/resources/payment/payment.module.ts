import { Module } from '@nestjs/common';
import { StatusService } from './status/status.service';
import { PaymentController } from './payment.controller';
import { PrismaModule } from '../../infrastructure/database/prisma/prisma.module';
import { HttpModule } from '@nestjs/axios';

@Module({
  providers: [StatusService],
  controllers: [PaymentController],
  imports: [PrismaModule, HttpModule],
})
export class PaymentModule {}
