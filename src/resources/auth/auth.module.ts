import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { LoginService } from './login/login.service';
import { LogoutService } from './logout/logout.service';
import { RegisterService } from './register/register.service';

@Module({
  controllers: [AuthController],
  providers: [LoginService, LogoutService, RegisterService]
})
export class AuthModule {}
