import { Injectable } from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { InvalidDataException } from '../../../utils/exceptions/github.exception';
import { OctokitService } from '../octokit/octokit.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EventNames } from 'src/core/events/event.module';
import { AlsService } from '@/utils/als/als.service';
import { ProjectService } from '@/resources/projects/create-project/project.service';

@Injectable()
export class WebhooksService {
  constructor(private readonly octokitService: OctokitService,
    private eventEmitter: EventEmitter2,
    private alsService : AlsService,
    private projectService : ProjectService,
  ) {}

  async createWebhook(owner: string, repo: string, email: string) {
    try {
      const octokit = await this.octokitService.getOctokit(email);
      const webhookUrl = process.env.DEP_WEBHOOK_URL;
  
      const { data: existingHooks } = await octokit.repos.listWebhooks({
        owner,
        repo,
      });
  
      const hookExists = existingHooks.some(
        hook => hook.config.url === webhookUrl
      );
  
      if (hookExists) {
        return { message: 'Webhook already exists' };
      }
  
      await octokit.repos.createWebhook({
        owner,
        repo,
        config: {
          url: webhookUrl,
          secret: process.env.DEP_WEBHOOK_SECRET,
          content_type: 'json',
        },
        events: ['push'],
        active: true,
      });
  
      return { message: 'Webhook created successfully' };
    } catch (error) {
      if (error.status === 422 && error.response?.data?.message?.includes('already exists')) {
        return { message: 'Webhook already exists' };
      }
      console.log('Error creating webhook:', error);
      throw new InvalidDataException('Failed to create webhook: ' + error.message);
    }
  }
  async handleWebhookEvent(signature: string, event: string, payload: any) {
    const hmac = createHmac('sha256', process.env.DEP_WEBHOOK_SECRET);
    const digest = Buffer.from(
      'sha256=' + hmac.update(JSON.stringify(payload)).digest('hex'),
      'utf8',
    );
    const checksum = Buffer.from(signature, 'utf8');

    if (!timingSafeEqual(digest, checksum)) {
      throw new InvalidDataException('Signatures did not match!');
    }

    const repositoryId = payload.repository?.id;
    const repositoryName = payload.repository?.full_name; 
    const branch = payload.ref.replace('refs/heads/', '');

    // if this is an even from an registered repository and branch
    // return
    const project = await this.projectService.findByRepoAndBranch(repositoryId, branch);
    if (!project) {
      console.log('Project not found for this repository and branch');
      return;
    }

    const user = project.linkedByUser;
    const githubAccessToken = user.githubAccessToken;
    this.alsService.runWithrepositoryInfo(repositoryId,repositoryName,() => {
      this.eventEmitter.emit(EventNames.PushEventReceived, {repoData : payload, githubAccessToken : githubAccessToken});    
    });

    console.log(`Received event: ${event}`);
    console.log('Payload:', JSON.stringify(payload, null, 2)); 
  }
}
