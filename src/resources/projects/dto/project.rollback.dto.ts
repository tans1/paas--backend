import { ApiProperty } from "@nestjs/swagger";

export class ProjectRollbackDto {
  @ApiProperty({
    example: 1,
    description: 'The unique identifier of the project.',
  })
  projectId: number;

  @ApiProperty({
    example: 1,
    description: 'The unique identifier of the deployment to rollback to.',
  })
  deploymentId: number;
}