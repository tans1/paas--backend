import 'reflect-metadata';
import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { NextJsModule } from './nextjs.module';
import { NextJsProjectScannerService } from './nextjs-project-scanner/nextjs-project-scanner.service';
import { NextJsDockerfileService } from './nextjs-docker-config/nextjs-dockerfile.service';
import { NextJsDockerIgnoreFileService } from './nextjs-docker-config/nextjs-dockerignorefile.service';
import { NextJsProjectService } from './nextjs-project-service';
import { AlsService } from '@/utils/als/als.service';
import { ProjectsRepositoryInterface } from '@/infrastructure/database/interfaces/projects-repository-interface/projects-repository-interface.interface';

// Mock AlsModule and InterfacesModule
jest.mock('@/utils/als/als.module', () => ({ AlsModule: class {} }));
jest.mock(
  '@/infrastructure/database/interfaces/interfaces.module',
  () => ({ InterfacesModule: class {} }),
);

describe('NextJsModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [
        EventEmitterModule.forRoot(),
        NextJsModule,
      ],
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

  it('provides NextJsProjectScannerService', () => {
    const svc = module.get(NextJsProjectScannerService);
    expect(svc).toBeInstanceOf(NextJsProjectScannerService);
  });

  it('provides NextJsDockerfileService', () => {
    const svc = module.get(NextJsDockerfileService);
    expect(svc).toBeInstanceOf(NextJsDockerfileService);
  });

  it('provides NextJsDockerIgnoreFileService', () => {
    const svc = module.get(NextJsDockerIgnoreFileService);
    expect(svc).toBeInstanceOf(NextJsDockerIgnoreFileService);
  });

  it('provides NextJsProjectService', () => {
    const svc = module.get(NextJsProjectService);
    expect(svc).toBeInstanceOf(NextJsProjectService);
  });
});
