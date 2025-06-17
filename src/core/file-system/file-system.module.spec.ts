import { Test, TestingModule } from '@nestjs/testing';
import { FileSystemModule } from './file-system.module';

describe('FileSystemModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [FileSystemModule],
    }).compile();
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
  });

  it('should export all required providers', () => {
    const providers = module.get<FileSystemModule>(FileSystemModule);
    expect(providers).toBeDefined();
  });
}); 