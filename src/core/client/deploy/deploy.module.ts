import { Module } from '@nestjs/common';
import { PushEventListenerService } from './push-event-listener/push-event-listener.service';
import { RepositoryBootstrapService } from './repository-bootstrap/repository-bootstrap.service';
import { RepositorySyncService } from './repository-sync/repository-sync.service';

@Module({
  providers: [PushEventListenerService, RepositoryBootstrapService, RepositorySyncService]
})
export class DeployModule {}
