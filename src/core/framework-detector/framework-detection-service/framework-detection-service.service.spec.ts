import { Test, TestingModule } from '@nestjs/testing';
import { FrameworkDetectionServiceService } from './framework-detection.service';

describe('FrameworkDetectionServiceService', () => {
  let service: FrameworkDetectionServiceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FrameworkDetectionServiceService],
    }).compile();

    service = module.get<FrameworkDetectionServiceService>(
      FrameworkDetectionServiceService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
