import { Test, TestingModule } from '@nestjs/testing';
import { Module } from '@nestjs/common';
import { UploadModule } from './upload/upload.module';
import { DeployModule } from './deploy/deploy.module';
import { ClientController } from './client.controller';
import { EventsModule } from '../events/event.module';
import { AlsModule } from '../../utils/als/als.module';
import { AlsService } from '@/utils/als/als.service';
import { UsersModule } from '@/resources/users/users.module';
import { ClientModule } from './client.module';

describe('ClientModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [
        UploadModule,
        DeployModule,
        EventsModule,
        AlsModule,
        UsersModule,
      ],
      providers: [AlsService],
      controllers: [ClientController],
    }).compile();
  });

  describe('Module Configuration', () => {
    it('should compile the module', () => {
      expect(module).toBeDefined();
    });

    it('should import required modules', () => {
      const moduleMetadata = module.select(ClientModule).get<typeof Module>(Module);
      
      expect(moduleMetadata).toBeDefined();
      
      // Get module imports using the metadata
      const imports = Reflect.getMetadata('module:imports', ClientModule);
      expect(imports).toBeDefined();
      expect(imports.length).toBe(5);
      
      // Verify each import
      const importNames = imports.map(m => m.name);
      expect(importNames).toContain(UploadModule.name);
      expect(importNames).toContain(DeployModule.name);
      expect(importNames).toContain(EventsModule.name);
      expect(importNames).toContain(AlsModule.name);
      expect(importNames).toContain(UsersModule.name);
    });

    it('should provide required services', () => {
      const moduleMetadata = module.select(ClientModule).get<typeof Module>(Module);
      
      // Get providers using metadata
      const providers = Reflect.getMetadata('module:providers', ClientModule);
      expect(providers).toBeDefined();
      expect(providers.length).toBe(1);
      expect(providers[0].name).toBe(AlsService.name);
    });

    it('should register required controllers', () => {
      const moduleMetadata = module.select(ClientModule).get<typeof Module>(Module);
      
      // Get controllers using metadata
      const controllers = Reflect.getMetadata('module:controllers', ClientModule);
      expect(controllers).toBeDefined();
      expect(controllers.length).toBe(1);
      expect(controllers[0].name).toBe(ClientController.name);
    });
  });
});