import { Module } from '@nestjs/common';
import { UploadModule } from './upload/upload.module';
import { DeployModule } from './deploy/deploy.module';

@Module({
  imports: [UploadModule, DeployModule]
})
export class ClientModule {}
