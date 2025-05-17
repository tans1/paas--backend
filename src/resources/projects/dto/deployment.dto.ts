// src/projects/dto/deployment.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DeploymentDto {
  @ApiProperty({
    example: 1,
    description: 'The unique identifier of the deployment.',
  })
  id: number;

  @ApiProperty({
    example: 1,
    description: 'The project ID associated with this deployment.',
  })
  projectId: number;

  @ApiProperty({
    example: 'completed',
    description: 'The status of the deployment.',
  })
  status: string;

  @ApiProperty({
    example: 'main',
    description: 'The branch that was deployed.',
  })
  branch: string;

  @ApiPropertyOptional({
    example: { NODE_ENV: 'production' },
    description: 'The environment variables used in the deployment.',
  })
  environmentVariables?: any;

  @ApiPropertyOptional({
    example: 2,
    description: 'The deployment ID to rollback to, if applicable.',
  })
  rollbackToId?: number;

  @ApiPropertyOptional({
    type: () => [DeploymentDto],
    description: 'List of deployments that have been rolled back.',
  })
  rollbackedDeployments?: DeploymentDto[];

  @ApiProperty({
    example: '2025-01-01T00:00:00.000Z',
    description: 'The creation timestamp of the deployment.',
  })
  createdAt: Date;

  @ApiPropertyOptional({
    type: 'array',
    items: { type: 'object' },
    description: 'Deployment logs associated with this deployment.',
  })
  logs?: any[];
}
