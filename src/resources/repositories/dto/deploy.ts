import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsObject, IsOptional } from 'class-validator';

export class DeployDto {
  @ApiProperty({
    example: 'owner',
    description:
      'The owner of the repository (GitHub username or organization)',
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
    default: 'main',
  })
  @IsString()
  @IsOptional()
  branch?: string;

  @ApiProperty({
    example: 'Angular',
    description: 'Framework of the project to deploy',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  framework: string;

  @ApiProperty({
    example: { API_KEY: '12345', ENV: 'production' },
    description: 'Environment variables as key-value pairs',
    additionalProperties: { type: 'string' },
    required: false,
    type: Object,
  })
  @IsObject()
  @IsOptional()
  envVars?: string;

  @ApiProperty({
    description: 'Environment file (e.g., .env)',
    type: 'string',
    format: 'binary',
    required: false,
  })
  @IsOptional()
  envFile?: any;

  @ApiProperty({
    example: '`yarn install`, `pnpm install`, `npm install`, or `bun install`',
    description: 'Install command',
    required: false,
  })
  @IsString()
  @IsOptional()
  installCommand?: string;

  @ApiProperty({
    example: 'npm run build',
    description: 'Build command',
    required: false,
  })
  @IsString()
  @IsOptional()
  buildCommand?: string;

  @ApiProperty({
    example: 'npm run start',
    description: 'Run command',
    required: false,
  })
  @IsString()
  @IsOptional()
  runCommand?: string;

  @ApiProperty({
    example: 'build',
    description: 'Output Directory',
    required: false,
  })
  @IsString()
  @IsOptional()
  outputDirectory?: string;

  @ApiProperty({
    example: '/',
    description: 'Root Directory',
    required: false,
  })
  @IsString()
  @IsOptional()
  rootDirectory?: string;

  @ApiProperty({
    example: `A responsive web application built with Angular for managing tasks, 
    featuring real-time updates, user authentication, and a clean UI.',`,
    description: 'Project Description',
    required: false,
  })
  @IsString()
  @IsOptional()
  projectDescription?: string;
}
