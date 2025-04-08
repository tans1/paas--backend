import { Body, Controller, Post } from '@nestjs/common';
import { DnsService } from './dns.service';
import { Public } from '../auth/public-strategy';
import { DNSDto } from './dto/dns.dto';

import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Controller('dns')
export class DnsController {
  constructor(
    private readonly dnsService: DnsService,
    @InjectQueue('dns-propagation') private readonly dnsQueue: Queue,
  ) {}

  @Public()
  @Post()
  async createDns(@Body() body: DNSDto) {
    try {
      const { domain, projectId } = body;
      const zone = await this.dnsService.createZone(domain);
      const [aRecord, cnameRecord] = await this.dnsService.createDNSRecords(
        zone.id,
        domain,
      );
      await this.dnsService.createDockerComposeFile(domain, projectId);
      await this.dnsQueue.add('check-propagation', {
        userId: 1,
        domain,
        projectId,
        zoneId: zone.id,
        aRecordId: aRecord.id,
        cnameRecordId: cnameRecord.id,
        name_servers: zone.name_servers,
      });

      return {
        message: 'Please update your domain registrar with these nameservers:',
        nameservers: zone.name_servers,
        next_steps: [
          'Update nameservers at your domain registrar',
          'Propagation typically takes 24-48 hours',
          'We will notify you once setup is complete',
        ],
        documentation_url: 'https://example.com/nameserver-setup-guide',
      };
    } catch (error) {
      console.error('Error creating DNS:', error);
      return error;
    }
  }
}

// import { Processor, WorkerHost } from '@nestjs/bullmq';
// import { Job } from 'bullmq';
// import { DnsService } from './dns.service';

// @Processor(
//   'dns-propagation',
//   /* to enable parallel processing of n jobs */ { concurrency: 2 },
// )
// export class DnsJobProcessor extends WorkerHost {
//   constructor(private readonly dnsService: DnsService) {
//     super();
//   }

//   async process(job: Job<{ domain: string; projectId: number }>) {
//     const { domain, projectId } = job.data;
//     const expectedIP = process.env['SERVER_IP'];

//     let propagated = false;
//     while (!propagated) {
//       propagated = await this.dnsService.checkPropagation(domain, expectedIP);
//       if (!propagated) {
//         await new Promise((resolve) => setTimeout(resolve, 10 * 60 * 1000));
//       }
//     }

//     // Once the domain has propagated
//     await this.dnsService.runDockerCompose(domain, projectId);
//     // TODO: Get the old domain from the database
//     // await this.dnsService.createDomainRedirection(oldDomain, domain);
//     // await this.dnsService.deleteOldDNSRecords(projectId);
//     // await this.dnsService.notifyUser()
//   }
// }
