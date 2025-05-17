import { Test, TestingModule } from '@nestjs/testing';
import { FrameworkDetectorModule } from './framework-detector.module';

describe('FrameworkDetectorModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [FrameworkDetectorModule],
    }).compile();
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
  });
}); 