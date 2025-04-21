import { Test, TestingModule } from '@nestjs/testing';
import { PushEventListenerService } from './push-event-listener.service';

describe('PushEventListenerService', () => {
  let service: PushEventListenerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PushEventListenerService],
    }).compile();

    service = module.get<PushEventListenerService>(PushEventListenerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
