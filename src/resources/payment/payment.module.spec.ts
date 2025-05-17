import { Test, TestingModule } from '@nestjs/testing';
import { PaymentModule } from './payment.module';
import { PaymentController } from './payment.controller';

describe('PaymentModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [PaymentModule],
    }).compile();
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
  });

  it('should provide PaymentController', () => {
    const controller = module.get<PaymentController>(PaymentController);
    expect(controller).toBeDefined();
  });
}); 