import { Controller, Get, UseGuards, Req, Body, Query } from '@nestjs/common';
import { Request } from 'express';
import { ProjectsService } from './projects.service';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ProjectDto } from './dto/project.dto'; // Adjust the import path and DTO name as needed

@Controller('projects')
export class ProjectsController { 
  constructor(private projectsService: ProjectsService) {}

  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Retrieve all projects for the authenticated user' })
  @ApiResponse({
    status: 200,
    description: 'User projects returned successfully',
    type: [ProjectDto],
  })
  @Get('my-projects')
  async getMyProjects(@Req() req: Request) {
    // JwtAuthGuard should attach the decoded user payload to req.user
    const user = req.user as { id: number };
    return await this.projectsService.getProjects(user.id);
  }

  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Retrieve project by repoId' })
  @ApiResponse({
    status: 200,
    description: 'User projects returned successfully',
    type: ProjectDto,
  })
  @Get('my-project')
  async getMyProject(@Query('repoId') repoId: number,@Query('branch') branch: string, @Req() req: Request) {
    return await this.projectsService.getProject(repoId,branch);
  }
  
}
