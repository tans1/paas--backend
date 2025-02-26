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
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Request, Response } from 'express';

import { ConnectService } from './connect/connect.service';
import { WebhooksService } from './webhooks/webhooks.service';
import { ListService } from './list/list.service';
import { OtherException } from '@/utils/exceptions/github.exception';
import { DeployDto } from './dto/deploy';
import { Public } from '../auth/public-strategy';
import { ProjectService } from './project/create-project/project.service';
import { UsersService } from '../users/users.service';
import { AuthenticatedRequest } from '../../utils/types/user.types';

@ApiTags('Repositories')
@Controller('repositories')
export class RepositoriesController {
  constructor(
    private connectService: ConnectService,
    private webHookService: WebhooksService,
    private listService: ListService,
    private projectService: ProjectService,
    private userService: UsersService,
  ) {}

  @ApiOperation({
    summary: 'Connect the user github account with the app',
    description:
      "To connect the user github account with the app, incase the user is not connected and didn't registered with github account initially",
  })
  @Public()
  @Get('/connect/github')
  async redirectToGitHubAuth(@Res() res: Response) {
    res.redirect(this.connectService.redirectToGitHubAuth());
  }

  @ApiOperation({
    summary: 'a callback endpoint to handle the github connection',
    description:
      "This endpoint is called by github after the user has connected the account with the app, it will handle the callback and save the user's github token",
  })
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
  @ApiResponse({
    status: 200,
    description: 'Returns a list of user repositories.',
  })
  @ApiBearerAuth('JWT-auth')
  @Get('/user')
  async listUserRepositories(@Req() req: AuthenticatedRequest) {
    const email = req.user.email;
    // const user = await this.userService.findOneBy(email);
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
    // const user = await this.userService.findOneBy(email);
    return this.listService.getRepoInfo(email, owner, repo);
  }

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
  @Post('/deploy')
  async createWebhook(
    @Req() req: AuthenticatedRequest,
    @Body() body: DeployDto,
  ) {
    const { owner, repo } = body;
    const email = req.user.email;
    // const user = await this.userService.findOneBy(email);
    return this.webHookService.createWebhook(owner, repo, email);
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
    
    if(event == 'ping'){
      await this.projectService.createProject(payload);
    }
    await this.webHookService.handleWebhookEvent(signature, event, payload);
  }
}
