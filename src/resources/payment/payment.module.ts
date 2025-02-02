import { Module } from '@nestjs/common';
import { InitiateService } from './initiate/initiate.service';
import { StatusService } from './status/status.service';
import { HistoryService } from './history/history.service';
import { PaymentController } from './payment.controller';

@Module({
  providers: [InitiateService, StatusService, HistoryService],
  controllers: [PaymentController],
})
export class PaymentModule {}
