import { ApiProperty } from '@nestjs/swagger';
export class BaseUser {
  @ApiProperty()
  id?: number;
  @ApiProperty()
  email: string;
  @ApiProperty()
  newPassword: string;
  @ApiProperty()
  currentPassword?: string;
  @ApiProperty()
  designation?: string;
}
