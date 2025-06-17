// cra.module.spec.ts

import { Test, TestingModule } from '@nestjs/testing';
import { CRAModule } from './react.module';
import { CRAProjectScannerService } from './cra-project-scanner/cra-project-scanner.service';
import { CRAProjectService } from './cra-project-service';
import { CRADockerfileService } from './cra-docker-config/cra-dockerfile.service';
import { CRADockerIgnoreFileService } from './cra-docker-config/cra-dockerignorefile.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AlsService } from '@/utils/als/als.service';
import { ProjectsRepositoryInterface } from '@/infrastructure/database/interfaces/projects-repository-interface/projects-repository-interface.interface';

describe('CRAModule', () => {
  let module: TestingModule;

  const mockEventEmitter = { emit: jest.fn() } as Partial<EventEmitter2>;
  const mockAlsService = {
    getrepositoryId: jest.fn(),
    getbranchName: jest.fn(),
  } as Partial<AlsService>;
  const mockProjectsRepo = {
    findByRepoAndBranch: jest.fn(),
  } as Partial<ProjectsRepositoryInterface>;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [CRAModule],
    })
      .overrideProvider(EventEmitter2).useValue(mockEventEmitter)
      .overrideProvider(AlsService).useValue(mockAlsService)
      .overrideProvider(ProjectsRepositoryInterface).useValue(mockProjectsRepo)
      .compile();
  });

  afterAll(async () => {
    await module.close();
  });

  it('should compile without errors', () => {
    expect(module).toBeDefined();
  });

  it('provides CRAProjectScannerService', () => {
    const svc = module.get(CRAProjectScannerService);
    expect(svc).toBeInstanceOf(CRAProjectScannerService);
  });

  it('provides CRAProjectService', () => {
    const svc = module.get(CRAProjectService);
    expect(svc).toBeInstanceOf(CRAProjectService);
  });

  it('provides CRADockerfileService', () => {
    const svc = module.get(CRADockerfileService);
    expect(svc).toBeInstanceOf(CRADockerfileService);
  });

  it('provides CRADockerIgnoreFileService', () => {
    const svc = module.get(CRADockerIgnoreFileService);
    expect(svc).toBeInstanceOf(CRADockerIgnoreFileService);
  });
});
