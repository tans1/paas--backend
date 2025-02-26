// src/projects/dto/project.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DeploymentDto } from './deployment.dto';

export class ProjectDto {
  @ApiProperty({ example: 1, description: 'The unique identifier of the project.' })
  id: number;

  @ApiProperty({ example: 101, description: 'The unique repository id of the project.' })
  repoId: number;

  @ApiProperty({ example: 'Awesome Project', description: 'The name of the project.' })
  name: string;

  @ApiProperty({ example: 'https://github.com/username/awesome-project', description: 'The URL of the project repository.' })
  url: string;

  @ApiProperty({ example: 10, description: 'The ID of the user who created (linked) the project.' })
  linkedByUserId: number;

  @ApiProperty({ example: '2025-01-01T00:00:00.000Z', description: 'The timestamp when the project was created.' })
  createdAt: Date;

  @ApiPropertyOptional({ example: '192.168.1.100', description: 'The deployed IP address if available.' })
  deployedIp?: string;

  @ApiPropertyOptional({ example: 3000, description: 'The deployed port if available.' })
  deployedPort?: number;

//   Optionally, if you want to include deployments information, you could add:
  @ApiPropertyOptional({ type: [DeploymentDto], description: 'List of deployments associated with the project.' })
  deployments?: DeploymentDto[];
}
