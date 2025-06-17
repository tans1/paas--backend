import { Controller, Delete, Get, HttpCode, HttpStatus, Post, Request } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { BaseUser } from './dto/base-user.dto';
import { UsersService } from './users.service';
import { AuthenticatedRequest } from '../../utils/types/user.types';
import { Roles } from '../auth/guards/role-guard/roles.decorator';
import { Role } from '@prisma/client';
import { UpdateUserDto } from './dto/update-user.dto';
@Controller('user')
export class UsersController {
  constructor(private readonly userService: UsersService) {}
  @HttpCode(HttpStatus.OK)
  @Get('all')
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'all users' })
  @ApiResponse({
    status: 200,
    description: 'The record found',
    type: [BaseUser],
  })
  all(@Request() req: AuthenticatedRequest) {
    return this.userService.findAll();
  }
  @HttpCode(HttpStatus.OK)
  @Get('profile')
  // @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'User Profile' })
  @ApiResponse({
    status: 200,
    description: 'The record found',
    type: [BaseUser],
  })
  profile(@Request() req: AuthenticatedRequest) {
    return this.userService.findOneBy(req.user.email);
  }

  @HttpCode(HttpStatus.OK)
  @Post('update')
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'update user' })
  @ApiResponse({
    status: 200,
    description: 'The record found',
    type: [BaseUser],
  })
  @ApiBody({
    type: UpdateUserDto
  })
  update(@Request() req) {
    return this.userService.update(req.body);
  }

  @HttpCode(HttpStatus.OK)
  @Delete('delete')
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'delete user' })
  @ApiResponse({
    status: 200,
    description: 'The record found',
    type: [BaseUser],
  })
  delete(@Request() req) {
    return this.userService.remove(req.body.id);
  }
}
