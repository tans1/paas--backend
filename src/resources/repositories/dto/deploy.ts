import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsObject, IsOptional } from 'class-validator';

export class DeployDto {
  @ApiProperty({
    example: 'owner',
    description: 'The owner of the repository (GitHub username or organization)',
  })
  @IsNotEmpty()
  @IsString()
  owner: string;

  @ApiProperty({
    example: 'my-repo',
    description: 'The name of the repository',
  })
  @IsNotEmpty()
  @IsString()
  repo: string;

  @ApiProperty({
    example: 'octocat',
    description: 'GitHub username initiating the deployment',
  })
  @IsNotEmpty()
  @IsString()
  githubUsername: string;

  @ApiProperty({
    example: 'main',
    description: 'Branch name to deploy',
    required: false,
    default: 'main'
  })
  @IsString()
  @IsOptional()
  branch?: string;

  @ApiProperty({
    example: { API_KEY: '12345', ENV: 'production' },
    description: 'Environment variables as key-value pairs',
    additionalProperties: { type: 'string' },
    required: false,
    type: Object
  })
  @IsObject()
  @IsOptional()
  envVars?: string;

  @ApiProperty({
    description: 'Environment file (e.g., .env)',
    type: 'string',
    format: 'binary',
    required: false
  })
  @IsOptional()
  envFile?: any;
}