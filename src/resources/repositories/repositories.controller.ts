import {
  Controller,
  Get,
  Req,
  Post,
  Res,
  Body,
  Query,
  HttpCode,
  UploadedFile,
  UseInterceptors,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
  ApiConsumes,
} from '@nestjs/swagger';
import { Request,Response } from 'express';

import { ConnectService } from './connect/connect.service';
import { WebhooksService } from './webhooks/webhooks.service';
import { ListService } from './list/list.service';
import { OtherException } from '../../utils/exceptions/github.exception';
import { DeployDto } from './dto/deploy';
import { Public } from '../auth/public-strategy';
import { ProjectService } from '../projects/create-project/project.service';
import { AuthenticatedRequest } from '../../utils/types/user.types';
import { FileInterceptor } from '@nestjs/platform-express';
import { EnvironmentService } from '../../utils/environment/environment.service';
import { AlsService } from '../../utils/als/als.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EventNames } from '../../core/events/event.module';
import { FrameworkDetectionService } from '@/core/framework-detector/framework-detection-service/framework-detection.service';
import { CustomApiResponse } from '@/utils/api-responses/api-response';
import { AuthGuard } from '../auth/guards/auth-guard/auth.guard';
import { StatusGuard } from '../auth/guards/status-guard/user.status.guard';

@ApiTags('Repositories')
@Controller('repositories')
export class RepositoriesController {
  constructor(
    private connectService: ConnectService,
    private webHookService: WebhooksService,
    private listService: ListService,
    private projectService: ProjectService,
    private environmentService: EnvironmentService,
    private alsService: AlsService,
    private eventEmitter: EventEmitter2,
    private frameworkDetectionService: FrameworkDetectionService,
  ) {}

  @ApiBearerAuth('JWT-auth')
@Get('/connect/github')
@ApiOperation({
  summary: 'Connect the user github account with the app',
  description:
    'To connect the user github account with the app, in case the user is not connected and did not register with GitHub account initially',
})
@ApiResponse({
  status: 200,
  description: 'Connects user GitHub repo',
})
async redirectToGitHubAuth(
  @Req() req: AuthenticatedRequest,
) {
  
  const url = this.connectService.redirectToGitHubAuth(req.user)
  return {url :  url};
}

  @ApiOperation({
    summary: 'a callback endpoint to handle the github connection',
    description:
      "This endpoint is called by github after the user has connected the account with the app, it will handle the callback and save the user's github token",
  })
  // @Public()
  // @Get('/connect/github/callback')
  // async handleGitHubCallback(@Query('code') code: string) {
  //   if (!code) {
  //     throw new OtherException('No code provided');
  //   }

  //   return await this.connectService.handleGitHubCallback(code,"state");
  // }

  @ApiOperation({
    summary: 'List User Repositories',
    description: 'Fetches all repositories for a specific GitHub user.',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns a list of user repositories.',
  })
  @ApiBearerAuth('JWT-auth')
  @Get('/user')
  async listUserRepositories(@Req() req: AuthenticatedRequest) {
    const email = req.user.email;
    return this.listService.getAllUserRepos(email);
  }

  @ApiOperation({
    summary: 'Get Repository Info',
    description: 'Fetches information about a specific GitHub repository.',
  })
  @ApiQuery({
    name: 'owner',
    type: String,
    required: true,
    description:
      'The owner of the repository.which can be a GitHub username or organization name',
  })
  @ApiQuery({
    name: 'repo',
    type: String,
    required: true,
    description: 'The name of the repository.',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns detailed information about the repository.',
  })
  @ApiBearerAuth('JWT-auth')
  @Get('/user/info')
  async getRepoInfo(
    @Req() req: AuthenticatedRequest,
    @Query('owner') owner: string,
    @Query('repo') repo: string,
  ) {
    const email = req.user.email;
    return this.listService.getRepoInfo(email, owner, repo);
  }

  @UseGuards(StatusGuard)
  @ApiOperation({
    summary: 'Deploy',
    description:
      'Deploy a specific project and set up a webhook for a GitHub repository.',
  })
  @ApiBody({
    type: DeployDto,
    description: 'The data required to create a webhook.',
  })
  @ApiResponse({
    status: 201,
    description: 'Returns the details of the created webhook.',
  })
  @ApiBearerAuth('JWT-auth')
  @HttpCode(201)
  @Post('deploy')
  @UseInterceptors(FileInterceptor('envFile'))
  @ApiConsumes('multipart/form-data')
  async createWebhook(
    @Req() req: AuthenticatedRequest,
    @Body() body: DeployDto,
    @UploadedFile() envFile?: Express.Multer.File,
  ) {
    try {
      const {
        owner,
        repo,
        githubUsername,
        envVars,
        framework,
        installCommand,
        buildCommand,
        runCommand,
        outputDirectory,
        rootDirectory,
        projectDescription,
      } = body;
      let branch = body.branch;
      const email = req.user.email;

      const environmentVariables =
        await this.environmentService.processEnvironment(envVars, envFile);

      const [webhookResponse, repoInfo] = await Promise.all([
        this.webHookService.createWebhook(owner, repo, email),
        this.listService.getRepoInfo(email, owner, repo),
      ]);
      // Get the last commit here
      // Project description

      const repository = repoInfo.data;
      const defaulBranch = repository.default_branch;
      branch = branch ? branch : defaulBranch;
      const { data: lastCommitMessage } =
        await this.listService.getLastCommitMessage(email, owner, repo, branch);
      const project = await this.projectService.createProject({
        userName: githubUsername,
        repository,
        branch,
        environmentVariables,
        framework,
        installCommand,
        buildCommand,
        runCommand,
        outputDirectory,
        rootDirectory,
        projectDescription,
        lastCommitMessage,
      });

      const repositoryId = repository.id;
      const repositoryName = repository.full_name;
      const payload = {
        repository,
        branch,
        email,
        environmentVariables,
      };
      this.alsService.initContext();
      this.alsService.setRepositoryId(repositoryId);
      this.alsService.setProjectName(repositoryName);
      this.alsService.setframework(framework);
      this.alsService.setExtension();
      this.eventEmitter.emit(EventNames.PROJECT_INITIALIZED, payload);


      return CustomApiResponse.success(project, 'succefuuly created project');
    } catch (error) {
      console.error('Error creating webhook:', error);
      throw new OtherException('Failed to create webhook: ' + error.message);
    }
  }

  @ApiOperation({
    summary: 'Handle Webhook Events',
    description:
      'Handles events received from GitHub webhooks for a specific repository. This endpoint is called by GitHub.',
  })
  @Public()
  @Post('/webhook')
  async handleWebhookEvent(@Req() req: Request) {
    const signature = req.header('x-hub-signature-256');
    const event = req.header('X-GitHub-Event');
    const payload = req.body;
    if (!signature || !event || !payload) {
      throw new OtherException('Missing headers or payload');
    }

    if (event === 'ping') {
      return;
    }
    await this.webHookService.handleWebhookEvent(signature, event, payload);
  }

  @ApiOperation({
    summary: 'Detect Framework',
    description: 'Detects the framework used in a GitHub repository',
  })
  @ApiQuery({
    name: 'owner',
    type: String,
    required: true,
    description: 'The owner of the repository',
  })
  @ApiQuery({
    name: 'repo',
    type: String,
    required: true,
    description: 'The name of the repository',
  })
  @ApiQuery({
    name: 'branch',
    type: String,
    required: false,
    description: 'The branch to check (default: main)',
  })
  @ApiBearerAuth('JWT-auth')
  @Get('/detect-framework')
  async detectFramework(
    @Req() req: AuthenticatedRequest,
    @Query('owner') owner: string,
    @Query('repo') repo: string,
    @Query('branch') branch = 'main',
  ) {
    const email = req.user.email;

    try {
      const frameworks = await this.frameworkDetectionService.detectFramework({
        owner,
        repo,
        branch,
        email,
      });
      return CustomApiResponse.success(
        frameworks[0],
        frameworks.length > 0
          ? `${frameworks.length} framework(s) detected`
          : 'No supported frameworks detected',
      );
    } catch (error) {
      return CustomApiResponse.error(
        error.message,
        error.error_code,
        error.context,
      );
    }
  }


  /*
  @ApiOperation({
    summary: 'Rollback Deployment',
    description: 'Reverts a deployment to a previous version.',
  })
  @ApiQuery({
    name: 'projectId',
    type: Number,
    required: true,
    description: 'The ID of the project to rollback',
  })
  @ApiQuery({
    name: 'deploymentId',
    type: Number,
    required: true,
    description: 'The ID of the deployment to rollback to',
  })
  @ApiBearerAuth('JWT-auth')
  @Post('rollback')
  async rollbackDeployment(
    @Req() req: AuthenticatedRequest,
    @Query('projectId') projectId: number,
    @Query('deploymentId') deploymentId: number,
  ) {
    try {
      const email = req.user.email;
      const project = await this.projectService.findOne(projectId);

      if (!project) {
        throw new OtherException('Project not found');
      }

      // Verify user has access to this project
      if (project.user.email !== email) {
        throw new OtherException('Unauthorized access to project');
      }

      const deployment = await this.projectService.getDeployment(deploymentId);
      if (!deployment) {
        throw new OtherException('Deployment not found');
      }

      // Emit rollback event
      const payload = {
        project,
        deployment,
        email,
      };

      this.alsService.runWithrepositoryInfo(
        project.repositoryId,
        project.repositoryName,
        () => {
          this.eventEmitter.emit(EventNames.PROJECT_ROLLBACK, payload);
        },
      );

      return CustomApiResponse.success(null, 'Rollback initiated successfully');
    } catch (error) {
      return CustomApiResponse.error(
        error.message,
        error.error_code,
        error.context,
      );
    }
  }
  */
}
