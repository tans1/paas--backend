import { Module } from '@nestjs/common';
import { AlsService } from './als.service';

@Module({providers: [AlsService], exports: [AlsService]})
export class AlsModule {}
