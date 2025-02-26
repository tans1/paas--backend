import {
  Controller,
  Get,
  Req,
  Post,
  Res,
  Body,
  Query,
  HttpCode,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiBody,
} from '@nestjs/swagger';
import { Request, Response } from 'express';

import { ConnectService } from './connect/connect.service';
import { WebhooksService } from './webhooks/webhooks.service';
import { ListService } from './list/list.service';
import { OtherException } from '@/utils/exceptions/github.exception';
import { DeployDto } from './dto/deploy';
import { Public } from '../auth/public-strategy';
import { ProjectService } from './project/create-project/project.service';

@ApiTags('Repositories')
@Controller('repositories')
export class RepositoriesController {
  constructor(
    private connectService: ConnectService,
    private webHookService: WebhooksService,
    private listService: ListService,
    private projectService: ProjectService,
  ) {}
  @Public()
  @Get('/connect/github')
  async redirectToGitHubAuth(@Res() res: Response) {
    res.redirect(this.connectService.redirectToGitHubAuth());
  }
  @Public()
  @Get('/connect/github/callback')
  async handleGitHubCallback(@Query('code') code: string) {
    if (!code) {
      throw new OtherException('No code provided');
    }

    return await this.connectService.handleGitHubCallback(code);
  }

  @ApiOperation({
    summary: 'List User Repositories',
    description: 'Fetches all repositories for a specific GitHub user.',
  })
  @ApiQuery({
    name: 'githubUsername',
    type: String,
    required: true,
    description: 'The GitHub username of the user.',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns a list of user repositories.',
  })
  // @ApiBearerAuth('JWT-auth')
  @Public()
  @Get('/user')
  async listUserRepositories(@Query('githubUsername') githubUsername: string) {
    return this.listService.getAllUserRepos(githubUsername);
  }

  @ApiOperation({
    summary: 'Get Repository Info',
    description: 'Fetches information about a specific GitHub repository.',
  })
  @ApiQuery({
    name: 'githubUsername',
    type: String,
    required: true,
    description: 'The GitHub username of the repository owner.',
  })
  @ApiQuery({
    name: 'owner',
    type: String,
    required: true,
    description: 'The owner of the repository.',
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
  // @ApiBearerAuth('JWT-auth')
  @Public()
  @Get('/user/info')
  async getRepoInfo(
    @Query('githubUsername') githubUsername: string,
    @Query('owner') owner: string,
    @Query('repo') repo: string,
  ) {
    return this.listService.getRepoInfo(githubUsername, owner, repo);
  }

  @ApiOperation({
    summary: 'Create a Webhook',
    description: 'Sets up a webhook for a GitHub repository.',
  })
  @ApiBody({
    type: DeployDto,
    description: 'The data required to create a webhook.',
  })
  @ApiResponse({
    status: 201,
    description: 'Returns the details of the created webhook.',
  })
  // @ApiBearerAuth('JWT-auth')
  @HttpCode(201)
  @Public()
  @Post('/deploy')
  async createWebhook(@Body() body: DeployDto) {
    const { owner, repo, githubUsername } = body;
    return this.webHookService.createWebhook(owner, repo, githubUsername);
  }

  @ApiOperation({
    summary: 'Handle Webhook Events',
    description: 'Handles events received from GitHub webhooks.',
  })
  @ApiResponse({
    status: 200,
    description: 'Acknowledges receipt of the webhook event.',
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
    
    if(event == 'ping'){
      await this.projectService.createProject(payload);
    }
    await this.webHookService.handleWebhookEvent(signature, event, payload);
  }
}
