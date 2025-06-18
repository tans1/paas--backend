import { Test, TestingModule } from '@nestjs/testing';
import { AngularProjectScannerService } from './angular-project-scanner/angular-project-scanner.service';
import { AngularProjectService } from './angular-project-service';
import { AngularDockerfileService } from './angular-docker-config/angular-dockerfile.service';
import { AlsModule } from '../../../utils/als/als.module';
import { AngularDockerIgnoreFileService } from './angular-docker-config/angular-dockerignorefile.service';
import { InterfacesModule } from '@/infrastructure/database/interfaces/interfaces.module';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AngularModule } from './angular.module';

describe('AngularModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [
        AngularModule,
        AlsModule,
        InterfacesModule,
      ],
    }).compile();
  });

  describe('Providers Registration', () => {
    it('should register AngularProjectScannerService', () => {
      const service = module.get<AngularProjectScannerService>(AngularProjectScannerService);
      expect(service).toBeDefined();
    });

    it('should register AngularProjectService', () => {
      const service = module.get<AngularProjectService>(AngularProjectService);
      expect(service).toBeDefined();
    });

    it('should register AngularDockerfileService', () => {
      const service = module.get<AngularDockerfileService>(AngularDockerfileService);
      expect(service).toBeDefined();
    });

    it('should register AngularDockerIgnoreFileService', () => {
      const service = module.get<AngularDockerIgnoreFileService>(AngularDockerIgnoreFileService);
      expect(service).toBeDefined();
    });
  });

  describe('EventEmitter2 Integration', () => {
    it('should register EventEmitter2', () => {
      const eventEmitter = module.get<EventEmitter2>(EventEmitter2);
      expect(eventEmitter).toBeDefined();
    });
  });

  describe('Module Imports', () => {
    it('should import AlsModule', () => {
      const alsModule = module.select<AlsModule>(AlsModule);
      expect(alsModule).toBeDefined();
    });

    it('should import InterfacesModule', () => {
      const interfacesModule = module.select<InterfacesModule>(InterfacesModule);
      expect(interfacesModule).toBeDefined();
    });
  });
});