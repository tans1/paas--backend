import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty()
  @IsNotEmpty()
  @MinLength(6)
  name: string;

  @ApiProperty()
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty()
  @IsNotEmpty()
  role: Role;

  @ApiProperty()
  @IsNotEmpty()
  @MinLength(6)
  password: string;
}
