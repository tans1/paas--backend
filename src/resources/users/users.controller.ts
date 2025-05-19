import { Controller, Get, HttpCode, HttpStatus, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { BaseUser } from './dto/base-user.dto';
import { Request } from 'express';
import { Roles } from '../auth/guards/role-guard/roles.decorator';
import { Role } from '../auth/guards/role-guard/role.enum';
import { UsersService } from './users.service';
@Controller('user')
export class UsersController {
  constructor(private usersService : UsersService){

  }
  @HttpCode(HttpStatus.OK)
  @Get('profile')
  // @Roles(Role.Admin)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'User Profile' })
  @ApiResponse({
    status: 200,
    description: 'The record found',
    type: [BaseUser],
  })
  profile(@Req() req: Request) {
    const user = req.user as { sub: number };
    return this.usersService.findOneById(user.sub)
  }
}
