import { Test, TestingModule } from '@nestjs/testing';
import { ModulesModule } from './resources.module';
import { UsersModule } from './users/users.module';
import { AdminModule } from './admin/admin.module';
import { ServersModule } from './servers/servers.module';
import { AuthModule } from './auth/auth.module';
import { OauthModule } from './oauth/oauth.module';
import { PaymentModule } from './payment/payment.module';
import { RepositoriesModule } from './repositories/repositories.module';
import { InterfacesModule } from '../infrastructure/database/interfaces/interfaces.module';
import { ProjectsModule } from './projects/projects.module';
import { DnsModule } from './dns/dns.module';

describe('ModulesModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [ModulesModule],
    }).compile();
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
  });

  it('should import all required modules', () => {
    const modulesModule = module.get(ModulesModule);
    expect(modulesModule).toBeDefined();
    
    // Verify all required modules are imported
    expect(module.get(UsersModule)).toBeDefined();
    expect(module.get(AdminModule)).toBeDefined();
    expect(module.get(ServersModule)).toBeDefined();
    expect(module.get(AuthModule)).toBeDefined();
    expect(module.get(OauthModule)).toBeDefined();
    expect(module.get(PaymentModule)).toBeDefined();
    expect(module.get(RepositoriesModule)).toBeDefined();
    expect(module.get(InterfacesModule)).toBeDefined();
    expect(module.get(ProjectsModule)).toBeDefined();
    expect(module.get(DnsModule)).toBeDefined();
  });
}); 