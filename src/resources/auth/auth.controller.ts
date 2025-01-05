import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { BaseUser } from '../users/dto/base-user.dto';
import { LoginService } from './login/login.service';
import { RegisterService } from './register/register.service';
import { Public } from './public-strategy';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Controller("auth")
@ApiTags("auth")
export class AuthController {
  constructor(private loginService: LoginService, 
    private registerService : RegisterService) {}

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post("login")
  @ApiOperation({ summary: "User Login" })
  @ApiResponse({
    status: 200,
    description: "The record found",
    type: [BaseUser],
  })
  signIn(@Body() loginDto: LoginDto) {
    return this.loginService.logIn(loginDto.email, loginDto.password);
  }
  @Public()
  @HttpCode(HttpStatus.OK)
  @Post("signup")
  @ApiOperation({ summary: "User Signup" })
  @ApiResponse({
    status: 200,
    description: "The record found",
    type: [BaseUser],
  })
  signUp(@Body() registerDto: RegisterDto) {
    const payload = {
      ...registerDto,
      createdAt: new Date()
    }
    return this.registerService.register(payload);
  }
}
