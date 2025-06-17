import 'reflect-metadata';
import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { PythonModule } from './python.module';
import { PythonService } from './python.service';
import { PythonDockerfileService } from './python-docker-config/python-dockerfile.service';
import { PythonDockerIgnoreFileService } from './python-docker-config/python-dockerignorefile.service';
import { PythonScannerService } from './python-scanner/python-scanner.service';
import { AlsService } from '@/utils/als/als.service';
import { ProjectsRepositoryInterface } from '@/infrastructure/database/interfaces/projects-repository-interface/projects-repository-interface.interface';

// Mock the imported modules so their deep dependencies aren’t loaded
jest.mock('@/utils/als/als.module', () => ({ AlsModule: class {} }));
jest.mock(
  '@/infrastructure/database/interfaces/interfaces.module',
  () => ({ InterfacesModule: class {} }),
);

describe('PythonModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [
        EventEmitterModule.forRoot(),
        PythonModule,
      ],
    })
      // Provide a dummy AlsService
      .overrideProvider(AlsService)
      .useValue({
        getrepositoryId: () => 'dummyRepo',
        getbranchName: () => 'dummyBranch',
      })
      // Provide a dummy ProjectsRepositoryInterface
      .overrideProvider(ProjectsRepositoryInterface)
      .useValue({
        findByRepoAndBranch: async (repo: string, branch: string) => ({}),
      })
      .compile();
  });

  it('compiles successfully', () => {
    expect(module).toBeDefined();
  });

  it('provides PythonService', () => {
    const svc = module.get(PythonService);
    expect(svc).toBeInstanceOf(PythonService);
  });

  it('provides PythonDockerfileService', () => {
    const svc = module.get(PythonDockerfileService);
    expect(svc).toBeInstanceOf(PythonDockerfileService);
  });

  it('provides PythonDockerIgnoreFileService', () => {
    const svc = module.get(PythonDockerIgnoreFileService);
    expect(svc).toBeInstanceOf(PythonDockerIgnoreFileService);
  });

  it('provides PythonScannerService', () => {
    const svc = module.get(PythonScannerService);
    expect(svc).toBeInstanceOf(PythonScannerService);
  });
});
