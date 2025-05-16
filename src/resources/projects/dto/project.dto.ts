import { ApiProperty } from "@nestjs/swagger";

export class ProjectDto {
  @ApiProperty({
    example: 1,
    description: 'The unique identifier of the project.',
  })
  id: number;
}