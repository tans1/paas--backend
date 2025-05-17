import { Test, TestingModule } from '@nestjs/testing';
import { FrameWorksModule } from './frame-works.module';

describe('FrameWorksModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [FrameWorksModule],
    }).compile();
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
  });
}); 