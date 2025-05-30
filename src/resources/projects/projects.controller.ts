import {
  Controller,
  Get,
  Post,
  UseGuards,
  Req,
  Body,
  Query,
} from '@nestjs/common';
import { Request } from 'express';
import { ProjectsService } from './projects.service';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiBody,
} from '@nestjs/swagger';
import { ProjectResponseDto } from './dto/project.response.dto'; // Adjust the import path and DTO name as needed
import { ProjectDto, ProjectUpdateDto } from './dto/project.dto';
import { ManageProjectService } from './manage-project/manage-project.service';
import { CustomApiResponse } from '@/utils/api-responses/api-response';
import { ProjectRollbackDto } from './dto/project.rollback.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EventNames } from '@/core/events/event.module';
import { AlsService } from '@/utils/als/als.service';
import { EnvironmentService } from '@/utils/environment/environment.service';

@Controller('projects')
export class ProjectsController {
  constructor(
    private projectsService: ProjectsService,
    private manageProjectService: ManageProjectService,
    private eventEmitter: EventEmitter2, 
    private alsService: AlsService, 
    private environmentService: EnvironmentService
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
    const user = req.user as { sub: number };
    return await this.projectsService.getProjects(user.sub);
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
    return await this.projectsService.getProject(repoId, branch);
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
  async startProject(@Body() body: ProjectDto) {
    const { id } = body;

    const project = await this.manageProjectService.startProject(id);
    return CustomApiResponse.success(
      project,
      `Successfully started the project`,
    );
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
  async stopProject(@Body() body: ProjectDto) {
    const { id } = body;

    const project = await this.manageProjectService.stopProject(id);
    return CustomApiResponse.success(
      project,
      `Successfully stopped the project`,
    );
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
    type: CustomApiResponse,
  })
  @Post('delete-project')
  async deleteProject(@Body() body: ProjectDto) {
    const { id } = body;

    const project = await this.manageProjectService.deleteProject(id);
    return CustomApiResponse.success(
      project,
      `Successfully deleted the project`,
    );
  }

  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Rollback project' })
  @ApiBody({
    type: ProjectRollbackDto,
    description: 'The data required to rollback a project',
  })
  @ApiResponse({
    status: 201,
    description: 'Returns the project.',
    type: CustomApiResponse,
  })
  @Post('rollback-project')
  async rollBackProject(@Body() body: ProjectRollbackDto) {
    const { projectId, deploymentId } = body;

    const project = await this.manageProjectService.rollback(
      projectId,
      deploymentId,
    );
    return CustomApiResponse.success(
      project,
      `Successfully rolled back the project`,
    );
  }

  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update project details' })
  @ApiBody({
    type: ProjectUpdateDto,
    description: 'The data required to update a project',
  })
  @ApiResponse({
    status: 200,
    description: 'Project updated successfully',
    type: CustomApiResponse,
  })
  @Post('update-project')
  async updateProject(@Body() body: ProjectUpdateDto) {
    const { id, ...updateData } = body;

    const project = await this.manageProjectService.updateProject(
      id,
      updateData,
    );
    if (body.environmentVariables){
      
      this.alsService.initContext();
      this.alsService.setbranchName(project.branch);
      this.alsService.setLastCommitMessage(project.lastCommitMessage)
      this.alsService.setExtension()
      this.alsService.setRepositoryId(project.repoId);
      this.alsService.setProjectName(project.name);    

      await this.environmentService.addEnvironmentFile(
        {
          environmentVariables : project.environmentVariables as Record<string, string>,
          projectPath : project.localRepoPath,
      }
      )
      this.eventEmitter.emit(EventNames.SourceCodeReady, {
        projectPath: project.localRepoPath,
      });

    }
    return CustomApiResponse.success(
      project,
      `Successfully updated the project`,
    );
  }
}
