import { Injectable } from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { InvalidDataException } from '../../../utils/exceptions/github.exception';
import { OctokitService } from '../octokit/octokit.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EventNames } from 'src/core/events/event.module';
import { AlsService } from '@/utils/als/als.service';

@Injectable()
export class WebhooksService {
  constructor(private readonly octokitService: OctokitService,
    private eventEmitter: EventEmitter2,
    private alsService : AlsService
  ) {}

  async createWebhook(owner: string, repo: string, githubUsername: string) {
    const octokit = await this.octokitService.getOctokit(githubUsername);

    const webhookConfig = {
      owner,
      repo,
      config: {
        url: process.env.DEP_WEBHOOK_URL,
        secret: process.env.DEP_WEBHOOK_SECRET,
        content_type: 'json',
      },
      events: ['push'],
      active: true,
    };

    // const response = await octokit.repos.createWebhook(webhookConfig);
    // return response.data;

    await octokit.repos.createWebhook(webhookConfig);
    return { message: 'Webhook created successfully' };
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

    // TODO: might not be the correct user Id
    const repositoryId = payload.repository?.id; 
    this.alsService.runWithrepositoryId(repositoryId, () => {
      // this.eventEmitter.emit("deployment.start", repo); 
      this.eventEmitter.emit(EventNames.PushEventReceived, payload);    
    });

    console.log(`Received event: ${event}`);
    console.log('Payload:', JSON.stringify(payload, null, 2)); 
  }
}
