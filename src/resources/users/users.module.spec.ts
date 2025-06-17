import { Test, TestingModule } from '@nestjs/testing';
import { UsersModule } from './users.module';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { ProfileService } from './profile/profile.service';
import { AlertService } from './alert/alert.service';
import { DtoModule } from './dto/dto.module';
import { InterfacesModule } from '@/infrastructure/database/interfaces/interfaces.module';
import { ModuleRef, ModulesContainer } from '@nestjs/core/injector';

describe('UsersModule', () => {
  let module: TestingModule;
  let modulesContainer: ModulesContainer;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [UsersModule],
    }).compile();

    modulesContainer = module.get<ModulesContainer>(ModulesContainer);
    jest.clearAllMocks();
  });

  describe('Module Configuration', () => {
    it('should compile the module', () => {
      expect(module).toBeDefined();
    });

    describe('UsersModule Imports', () => {
      it('should import required modules', () => {
        const dtoModuleRef = modulesContainer.get('DtoModule');
        const interfacesModuleRef = modulesContainer.get('InterfacesModule');

        expect(dtoModuleRef).toBeDefined();
        expect(interfacesModuleRef).toBeDefined();
      });
    });
  });
  describe('Providers Registration', () => {
    it('should register all providers', () => {
      const profileService = module.get<ProfileService>(ProfileService);
      const alertService = module.get<AlertService>(AlertService);
      const usersService = module.get<UsersService>(UsersService);

      expect(profileService).toBeDefined();
      expect(alertService).toBeDefined();
      expect(usersService).toBeDefined();
    });
  });

  describe('Controller Registration', () => {
    it('should register UsersController', () => {
      const controller = module.get<UsersController>(UsersController);
      expect(controller).toBeDefined();
    });
  });

  describe('Export Configuration', () => {
    it('should export UsersService', () => {
      const exportedProvider = module.select(UsersModule).get<UsersService>(UsersService);
      expect(exportedProvider).toBeDefined();
    });
  });
});