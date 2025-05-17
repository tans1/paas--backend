import { Module } from '@nestjs/common';
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

@Module({
  imports: [
    UsersModule,
    AdminModule,
    ServersModule,
    AuthModule,
    OauthModule,
    PaymentModule,
    RepositoriesModule,
    InterfacesModule,
    ProjectsModule,
    DnsModule,
  ],
})
export class ModulesModule {}
