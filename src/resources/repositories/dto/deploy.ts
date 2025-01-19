import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class DeployDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  owner: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  repo: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  githubUsername: string;
}
