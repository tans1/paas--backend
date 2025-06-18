import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { DockerModule } from './docker.module';
import { DockerService } from './docker-service';
import { DockerfileScannerService } from './dockerfile-scanner/dockerfile-scanner.service';

// Mock AlsModule so Nest can import it
jest.mock('@/utils/als/als.module', () => ({
  AlsModule: class AlsModule {},
}));

describe('DockerModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [
        EventEmitterModule.forRoot(),
        DockerModule,
      ],
    }).compile();
  });

  it('should compile', () => {
    expect(module).toBeDefined();
  });

  it('provides DockerService', () => {
    const svc = module.get(DockerService);
    expect(svc).toBeInstanceOf(DockerService);
  });

  it('provides DockerfileScannerService', () => {
    const scanner = module.get(DockerfileScannerService);
    expect(scanner).toBeInstanceOf(DockerfileScannerService);
  });
});
