import { Test, TestingModule } from '@nestjs/testing';
import { ContainerSetupModule } from './container-setup.module';
import { ImageBuildGateway } from './Image-build-gateway';

describe('ContainerSetupModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [ContainerSetupModule],
    }).compile();
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
  });

  it('should provide ImageBuildGateway', () => {
    const gateway = module.get<ImageBuildGateway>(ImageBuildGateway);
    expect(gateway).toBeDefined();
  });
}); 