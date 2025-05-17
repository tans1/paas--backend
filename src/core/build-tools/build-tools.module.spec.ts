import { Test, TestingModule } from '@nestjs/testing';
import { BuildToolsModule } from './build-tools.module';

describe('BuildToolsModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [BuildToolsModule],
    }).compile();
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
  });

  it('should export all required providers', () => {
    const providers = module.get('BUILD_TOOLS_PROVIDERS');
    expect(providers).toBeDefined();
  });
}); 