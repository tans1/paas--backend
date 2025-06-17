import { Test, TestingModule } from '@nestjs/testing';
import { CliModule } from './cli.module';

describe('CliModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [CliModule],
    }).compile();
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
  });

  it('should export all required providers', () => {
    const providers = module.get(CliModule);
    expect(providers).toBeDefined();
  });
}); 