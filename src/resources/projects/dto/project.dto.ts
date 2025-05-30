import { ApiProperty } from '@nestjs/swagger';
import { ProjectStatus } from '@prisma/client';

export class ProjectDto {
  @ApiProperty({
    example: 1,
    description: 'The unique identifier of the project.',
  })
  id: number;
}

export class ProjectUpdateDto {
  @ApiProperty({
    example: 1,
    description: 'The unique identifier of the project.',
  })
  id: number;

  @ApiProperty({
    example: 'My Project',
    description: 'The name of the project.',
    required: false,
  })
  name?: string;

  @ApiProperty({
    example: 'https://github.com/user/repo',
    description: 'The URL of the project repository.',
    required: false,
  })
  url?: string;

  @ApiProperty({
    example: '192.168.1.1',
    description: 'The deployed IP address of the project.',
    required: false,
  })
  deployedIp?: string;

  @ApiProperty({
    example: 8080,
    description: 'The deployed port of the project.',
    required: false,
  })
  deployedPort?: number;

  @ApiProperty({
    example: 'http://192.168.1.1:8080',
    description: 'The deployed URL of the project.',
    required: false,
  })
  deployedUrl?: string;

  @ApiProperty({
    example: 123,
    description: 'The ID of the active deployment.',
    required: false,
  })
  activeDeploymentId?: number;

  @ApiProperty({
    example: '/path/to/local/repo',
    description: 'The local repository path of the project.',
    required: false,
  })
  localRepoPath?: string;

  @ApiProperty({
    example: 'zone123',
    description: 'The zone ID for the project.',
    required: false,
  })
  zoneId?: string;

  @ApiProperty({
    example: 'aRecord123',
    description: 'The A record ID for the project.',
    required: false,
  })
  aRecordId?: string;

  @ApiProperty({
    example: 'cnameRecord123',
    description: 'The CNAME record ID for the project.',
    required: false,
  })
  cnameRecordId?: string;

  @ApiProperty({
    example: 'Initial commit',
    description: 'The last commit message of the project.',
    required: false,
  })
  lastCommitMessage?: string;

  @ApiProperty({
    example: 'RUNNING',
    description: 'The status of the project.',
    enum: ProjectStatus,
    required: false,
  })
  status?: ProjectStatus;

  @ApiProperty({
    example: 'docker-compose.yml',
    description: 'The Docker Compose file for the project.',
    required: false,
  })
  dockerComposeFile?: string;

  @ApiProperty({
    example: 3000,
    description: 'The port used by the project.',
    required: false,
  })
  PORT?: number;

  @ApiProperty({
    example: { NODE_ENV: 'production' },
    description: 'The environment variables for the project.',
    required: false,
  })
  environmentVariables?: Record<string, string>;
}
