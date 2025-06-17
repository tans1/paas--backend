import 'reflect-metadata';
import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ViteModule } from './vite.module';
import { ViteProjectScannerService } from './vite-project-scanner/vite-project-scanner.service';
import { ViteDockerfileService } from './vite-docker-config/vite-dockerfile.service';
import { ViteDockerIgnoreFileService } from './vite-docker-config/vite-dockerignorefile.service';
import { ViteProjectService } from './vite-project-service';
import { AlsService } from '@/utils/als/als.service';
import { ProjectsRepositoryInterface } from '@/infrastructure/database/interfaces/projects-repository-interface/projects-repository-interface.interface';

// Mock imported modules so they don’t pull in real deps
jest.mock('@/utils/als/als.module', () => ({ AlsModule: class {} }));
jest.mock(
  '@/infrastructure/database/interfaces/interfaces.module',
  () => ({ InterfacesModule: class {} }),
);

describe('ViteModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [EventEmitterModule.forRoot(), ViteModule],
    })
      .overrideProvider(AlsService)
      .useValue({ getrepositoryId: () => '', getbranchName: () => '' })
      .overrideProvider(ProjectsRepositoryInterface)
      .useValue({ findByRepoAndBranch: async () => ({}) })
      .compile();
  });

  it('compiles successfully', () => {
    expect(module).toBeDefined();
  });

  it('provides ViteProjectScannerService', () => {
    const svc = module.get(ViteProjectScannerService);
    expect(svc).toBeInstanceOf(ViteProjectScannerService);
  });

  it('provides ViteDockerfileService', () => {
    const svc = module.get(ViteDockerfileService);
    expect(svc).toBeInstanceOf(ViteDockerfileService);
  });

  it('provides ViteDockerIgnoreFileService', () => {
    const svc = module.get(ViteDockerIgnoreFileService);
    expect(svc).toBeInstanceOf(ViteDockerIgnoreFileService);
  });

  it('provides ViteProjectService', () => {
    const svc = module.get(ViteProjectService);
    expect(svc).toBeInstanceOf(ViteProjectService);
  });

  it('exports only ViteProjectScannerService', () => {
    const exportsMeta: any[] = Reflect.getMetadata('exports', ViteModule) || [];
    expect(exportsMeta).toEqual([ViteProjectScannerService]);
  });
});
