import { Module } from '@nestjs/common';
import { PushEventListenerService } from './event-listeners/push-event-listener.service';
import { RepositoryBootstrapService } from './repository-bootstrap/repository-bootstrap.service';
import { RepositorySyncService } from './repository-sync/repository-sync.service';
import { AlsModule } from '../../../utils/als/als.module';
import { ProjectInitializedEventListenerService } from './event-listeners/project-initialized-event-listner.service';
import { UsersModule } from '../../../resources/users/users.module';

@Module({
  imports: [
    AlsModule,
    UsersModule
  ],
  providers: [
    PushEventListenerService, 
    RepositoryBootstrapService, 
    RepositorySyncService,
    ProjectInitializedEventListenerService
  ]
})
export class DeployModule {}
