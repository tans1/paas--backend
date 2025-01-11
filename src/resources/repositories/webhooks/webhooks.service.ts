import { Injectable } from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { InvalidDataException } from '../../../utils/exceptions/github.exception';
import { OctokitService } from '../utils/octokit';
@Injectable()
export class WebhooksService {
  constructor(private readonly octokitService: OctokitService) {}

  async createWebhook(owner: string, repo: string, githubUsername: string) {
    const octokit = await this.octokitService.getOctokit(githubUsername);

    const webhookConfig = {
      owner,
      repo,
      config: {
        url: process.env.DEP_WEBHOOK_URL,
        secret: process.env.WEBHOOK_SECRET,
        content_type: 'json',
      },
      events: ['push'],
      active: true,
    };

    const response = await octokit.repos.createWebhook(webhookConfig);

    return response.data;
  }
  async handleWebhookEvent(signature: string, event: string, payload: any) {
    const hmac = createHmac('sha256', process.env.WEBHOOK_SECRET);
    const digest = Buffer.from(
      'sha256=' + hmac.update(JSON.stringify(payload)).digest('hex'),
      'utf8',
    );
    const checksum = Buffer.from(signature, 'utf8');

    if (!timingSafeEqual(digest, checksum)) {
      throw new InvalidDataException('Signatures did not match!');
    }

    console.log(`Received event: ${event}`);
    console.log('Payload:', JSON.stringify(payload, null, 2));
  }
}
