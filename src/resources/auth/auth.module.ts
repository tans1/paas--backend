import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { LoginService } from './login/login.service';
import { LogoutService } from './logout/logout.service';
import { RegisterService } from './register/register.service';
import { UsersModule } from '../users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { AuthGuard } from './guards/auth-guard/auth.guard';
import { APP_GUARD } from '@nestjs/core';
import { jwtConstants } from './constants';
import { RolesGuard } from './guards/role-guard/roles.guard';

@Module({
  imports: [
    UsersModule,
    JwtModule.register({
      global: true,
      secret: jwtConstants.secret,
      signOptions: { expiresIn: '1d' },
    }),
  ],
  controllers: [AuthController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    LoginService,
    LogoutService,
    RegisterService,
  ],
})
export class AuthModule {}
