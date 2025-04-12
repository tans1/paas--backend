import { Body, Controller, Post } from '@nestjs/common';
import { DnsService } from './dns.service';
import { DNSDto } from './dto/dns.dto';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
} from '@nestjs/swagger';

@ApiTags('DNS')
@Controller('dns')
export class DnsController {
  constructor(
    private readonly dnsService: DnsService,
    @InjectQueue('dns-propagation') private readonly dnsQueue: Queue,
  ) {}

  @ApiBearerAuth('JWT-auth')
  @Post()
  @ApiOperation({
    summary: 'Create DNS records and configuration',
    description:
      'This endpoint creates a new DNS zone for the given domain, generates DNS records (A and CNAME), updates the SSL settings, creates a Docker Compose file, and triggers a DNS propagation check. The client is expected to update their domain registrar with the provided nameservers.',
  })
  @ApiBody({ type: DNSDto })
  @ApiResponse({
    status: 201,
    description: 'DNS configuration created successfully',
    content: {
      'application/json': {
        example: {
          message:
            'Please remove your existing name servers from your domain registrar and update it with these nameservers:',
          nameservers: ['ns1.example.com', 'ns2.example.com'],
          next_steps: [
            'Update nameservers at your domain registrar',
            'Propagation typically takes 24-48 hours',
            'We will notify you once setup is complete',
          ],
          documentation_url: 'https://example.com/nameserver-setup-guide',
        },
      },
    },
  })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async createDns(@Body() body: DNSDto) {
    try {
      const { domain, projectId } = body;
      const zone = await this.dnsService.createZone(domain);
      const [aRecord, cnameRecord] = await this.dnsService.createDNSRecords(
        zone.id,
        domain,
      );
      await this.dnsService.updateSSLSetting(zone.id);
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
        message:
          'Please remove your existing name servers from your domain registrar and update it with these nameservers:',
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
