import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { ProfileService } from './profile/profile.service';
import { AlertService } from './alert/alert.service';

@Module({
  controllers: [UsersController],
  providers: [ProfileService, AlertService]
})
export class UsersModule {}
