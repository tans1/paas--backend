import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class DeployDto {
  @ApiProperty({
    example: 'owner',
    description:
      'The owner of the repository,  which can be a GitHub username or organization name',
  })
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
