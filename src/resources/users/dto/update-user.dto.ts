import { ApiProperty } from '@nestjs/swagger';
import { BaseUser } from './base-user.dto';
import { Role, UserStatus } from '@prisma/client';
export class UpdateUserDto extends BaseUser {
  @ApiProperty()
  updatedAt: Date;
  @ApiProperty()
  name?: string;
  @ApiProperty()
  role?: Role;
  @ApiProperty()
  githubUsername?: string;
  @ApiProperty()
  githubAccessToken?: string;
  @ApiProperty()
  status?: UserStatus;
  @ApiProperty()
  suspendedAt?: Date;
}

