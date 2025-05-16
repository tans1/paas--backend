import { Module } from '@nestjs/common';
import { EnvironmentService } from './environment.service';
import { AlsModule } from '../als/als.module';

@Module({
  imports: [AlsModule],
  providers: [EnvironmentService],
  exports: [EnvironmentService],
})
export class EnvironmentModule {}
