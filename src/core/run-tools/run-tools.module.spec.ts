import { Test, TestingModule } from '@nestjs/testing';
import { RunToolsModule } from './run-tools.module';

describe('RunToolsModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [RunToolsModule],
    }).compile();
  });

  it('should be defined', () => {
    const providers = module.get(RunToolsModule);
    expect(providers).toBeDefined();
  });
}); 