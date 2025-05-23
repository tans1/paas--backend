import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { DnsService } from './dns.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { ProjectsRepositoryInterface } from '../../infrastructure/database/interfaces/projects-repository-interface/projects-repository-interface.interface';

@Processor('dns-propagation', {
  concurrency: 5,
  maxStalledCount: 2,
})
export class DnsJobProcessor extends WorkerHost {
  private readonly MAX_ATTEMPTS = 144;

  constructor(
    private readonly dnsService: DnsService,
    @InjectQueue('dns-propagation') private readonly dnsQueue: Queue,
    private readonly projectsRepositoryService: ProjectsRepositoryInterface,
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
    console.log(
      `inside the process method and beginning to check the dns propagation for the ${attempts} attempt`,
    );
    const expectedIP = process.env['SERVER_IP'];

    try {
      const propagated = await this.dnsService.checkPropagation(
        domain,
        expectedIP,
        name_servers,
      );

      if (!propagated) {
        console.log('Propagation not yet complete');
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
        const delay = Math.min(1000 * 60 * 10 * 2 ** nextAttempt, 3600000); // 10 min

        console.log(
          'going to add the job to the queue back and then recheck it',
        );
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
        console.log(
          `Job added to queue for domain ${domain} with attempt ${nextAttempt}`,
        );

        return;
      }

      console.log('Propagation complete');
      console.log('going to run the docker compose');
      // await this.dnsService.runDockerCompose(domain, projectId);
      console.group('after running the docker compose');
      console.log('going to create the domain redirection');
      // await this.dnsService.createDomainRedirection(domain, projectId);
      console.log('going to delete the old dns records');

      // await this.dnsService.deleteOldDNSRecords(projectId);
      // Update the custom domain status to live
      const customDomain =
        await this.projectsRepositoryService.findCustomDomainByDomainAndProjectId(
          domain,
          projectId,
        );
      if (customDomain) {
        await this.projectsRepositoryService.updateCustomDomain(
          customDomain.id,
          { live: true },
        );
      }
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
      console.log('error happend during job processing', error);
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
