import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { ProfileService } from './profile/profile.service';
import { AlertService } from './alert/alert.service';
import { DtoModule } from './dto/dto.module';
import { UsersService } from './users.service';
import { InterfacesModule } from 'src/infrastructure/database/interfaces/interfaces.module';

@Module({
  controllers: [UsersController],
  providers: [ProfileService, AlertService, UsersService],
  exports: [UsersService],
  imports: [DtoModule, InterfacesModule],
})
export class UsersModule {}
