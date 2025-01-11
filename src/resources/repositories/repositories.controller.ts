import { Controller, Get, Req, Post, Res, Body, Query } from '@nestjs/common';
import { Request, Response } from 'express';

import { ConnectService } from './connect/connect.service';
import { WebhooksService } from './webhooks/webhooks.service';
import { ListService } from './list/list.service';
import { OtherException } from '@/utils/exceptions/github.exception';
import { DeployDto } from './dto/deploy';
@Controller('repositories')
export class RepositoriesController {
  constructor(
    private connectService: ConnectService,
    private webHookService: WebhooksService,
    private listService: ListService,
  ) {}

  @Get('/auth/github')
  async redirectToGitHubAuth(@Res() res: Response) {
    res.redirect(this.connectService.redirectToGitHubAuth());
  }

  @Get('/auth/github/callback')
  async handleGitHubCallback(@Query('code') code: string) {
    if (!code) {
      throw new OtherException('No code provided');
    }

    return await this.connectService.handleGitHubCallback(code);
  }

  @Get('/user')
  async listUserRepositories(@Query('username') username: string) {
    return this.listService.getAllUserRepos(username);
  }

  @Get('/user/info')
  async getRepoInfo(
    @Query('username') username: string,
    @Query('owner') owner: string,
    @Query('repo') repo: string,
  ) {
    return this.listService.getRepoInfo(username, owner, repo);
  }

  @Post('/deploy')
  async createWebhook(@Body() body: DeployDto) {
    const { owner, repo, githubUsername } = body;
    return this.webHookService.createWebhook(owner, repo, githubUsername);
  }

  @Post('/webhook')
  async handleWebhookEvent(@Req() req: Request) {
    const signature = req.header('X-Hub-Signature-256');
    const event = req.header('X-GitHub-Event');
    const payload = req.body;
    await this.webHookService.handleWebhookEvent(signature, event, payload);
  }
}
