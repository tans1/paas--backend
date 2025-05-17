import { Test, TestingModule } from '@nestjs/testing';
import { InfrastructureModule } from './infrastructure.module';

describe('InfrastructureModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [InfrastructureModule],
    }).compile();
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
  });
}); 