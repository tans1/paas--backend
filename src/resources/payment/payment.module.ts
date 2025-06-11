import { Module } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { PrismaModule } from '../../infrastructure/database/prisma/prisma.module';
import { HttpModule } from '@nestjs/axios';
import { ContainerSetupModule } from '../../core/container-setup/container-setup.module';

@Module({
  providers: [PaymentService],
  controllers: [PaymentController],
  imports: [PrismaModule, HttpModule, ContainerSetupModule],
})
export class PaymentModule {}
