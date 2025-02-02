import { Test, TestingModule } from '@nestjs/testing';
import { CreateImageService } from './create-image.service';

describe('CreateImageService', () => {
  let service: CreateImageService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CreateImageService],
    }).compile();

    service = module.get<CreateImageService>(CreateImageService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
