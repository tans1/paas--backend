import { Controller, Get, Post,UseGuards, Req, Body, Query } from '@nestjs/common';
import { Request } from 'express';
import { ProjectsService } from './projects.service';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { ProjectResponseDto } from './dto/project.response.dto'; // Adjust the import path and DTO name as needed
import { ProjectDto } from './dto/project.dto';
import { ManageProjectService } from './manage-project/manage-project.service';
import { CustomApiResponse } from '@/utils/api-responses/api-response';

@Controller('projects')
export class ProjectsController {
  constructor(
    private projectsService: ProjectsService,
    private manageProjectService : ManageProjectService
  ) {}

  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Retrieve all projects for the authenticated user' })
  @ApiResponse({
    status: 200,
    description: 'User projects returned successfully',
    type: [ProjectResponseDto],
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
    type: ProjectResponseDto,
  })
  @Get('my-project')
  async getMyProject(
    @Query('repoId') repoId: number,
    @Query('branch') branch: string,
    @Req() req: Request,
  ) {
    return await this.projectsService.getProject(repoId, branch || 'main'); // TODO : handle this by having a default branch
  }

  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Start project' })
  @ApiBody({
      type: ProjectDto,
      description: 'The data required to start a project',
    })
  @ApiResponse({
    status: 200,
    description: 'Project started succesfully',
    type: CustomApiResponse,
  })
  @Post('start-project')
  async startProject(
    @Body() body: ProjectDto,
  ) {

    const {
      id
    } = body

    const project = await this.manageProjectService.startProject(id);
    return CustomApiResponse.success(project,`Successfully started the project`)
  }

  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Stop project' })
  @ApiBody({
      type: ProjectDto,
      description: 'The data required to stop a project',
    })
  @ApiResponse({
    status: 200,
    description: 'Project stopped succesfully',
    type: CustomApiResponse,
  })
  @Post('stop-project')
  async stopProject(
    @Body() body: ProjectDto,
  ) {

    const {
      id
    } = body

    const project = await this.manageProjectService.stopProject(id);
    return CustomApiResponse.success(project,`Successfully stopped the project`)
  }

  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete project' })
  @ApiBody({
      type: ProjectDto,
      description: 'The data required to delete a project',
    })
  @ApiResponse({
    status: 201,
    description: 'Returns the deleted project.',
    type: CustomApiResponse
  })
  @Post('delete-project')
  async deleteProject(
    @Body() body: ProjectDto,
  ) {

    const {
      id
    } = body

    const project = await this.manageProjectService.deleteProject(id);
    return CustomApiResponse.success(project,`Successfully deleted the project`)
  }


}
