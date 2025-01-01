import { Test, TestingModule } from '@nestjs/testing';
import { InitiateService } from './initiate.service';

describe('InitiateService', () => {
  let service: InitiateService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [InitiateService],
    }).compile();

    service = module.get<InitiateService>(InitiateService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
