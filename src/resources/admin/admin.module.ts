import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { UsersService } from './users/users.service';
import { AnalyticsService } from './analytics/analytics.service';
import { RolesService } from './roles/roles.service';

@Module({
  controllers: [AdminController],
  providers: [UsersService, AnalyticsService, RolesService],
})
export class AdminModule {}
