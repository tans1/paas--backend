import { ApiProperty } from '@nestjs/swagger';
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
  role: string;
 
  @ApiProperty()
  @IsNotEmpty()
  @MinLength(6)
  password: string;
}
