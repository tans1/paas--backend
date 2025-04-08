import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { DnsService } from './dns.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Processor('dns-propagation', {
  concurrency: 5,
  maxStalledCount: 2,
})
export class DnsJobProcessor extends WorkerHost {
  private readonly MAX_ATTEMPTS = 144;

  constructor(
    private readonly dnsService: DnsService,
    @InjectQueue('dns-propagation') private readonly dnsQueue: Queue,
  ) {
    super();
  }

  async process(
    job: Job<{
      userId: string;
      domain: string;
      projectId: number;
      zoneId: string;
      aRecordId: string;
      cnameRecordId: string;
      attempts?: number;
      name_servers: string[];
    }>,
  ) {
    const {
      userId,
      domain,
      projectId,
      zoneId,
      aRecordId,
      cnameRecordId,
      attempts = 0,
      name_servers,
    } = job.data;

    const expectedIP = process.env['SERVER_IP'];

    try {
      const propagated = await this.dnsService.checkPropagation(
        domain,
        expectedIP,
        name_servers,
      );

      if (!propagated) {
        if (attempts >= this.MAX_ATTEMPTS) {
          // this.logger.error(`Max attempts reached for ${domain}`);
          await this.dnsService.notifyUser(
            domain,
            userId,
            projectId,
            zoneId,
            aRecordId,
            cnameRecordId,
            'failed',
          );
          return;
        }

        const nextAttempt = attempts + 1;
        const delay = Math.min(1000 * 60 * 10 * 2 ** nextAttempt, 3600000);

        await this.dnsQueue.add(
          'check-propagation',
          { ...job.data, attempts: nextAttempt },
          {
            delay,
            jobId: `${domain}-attempt-${nextAttempt}-${Date.now()}`,
            removeOnComplete: true,
            removeOnFail: true,
          },
        );

        return;
      }

      await this.dnsService.runDockerCompose(domain, projectId);
      await this.dnsService.createDomainRedirection(domain, projectId);
      await this.dnsService.deleteOldDNSRecords(projectId);
      await this.dnsService.notifyUser(
        domain,
        userId,
        projectId,
        zoneId,
        aRecordId,
        cnameRecordId,
        'success',
      );
    } catch (error) {
      console.log(error);
      await this.dnsService.notifyUser(
        domain,
        userId,
        projectId,
        zoneId,
        aRecordId,
        cnameRecordId,
        'error',
      );
    }
  }
}
