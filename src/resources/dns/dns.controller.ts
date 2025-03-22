import { Body, Controller, Get, Post } from '@nestjs/common';
import { DnsService } from './dns.service';
import { Public } from '../auth/public-strategy';
import { DNSDto } from './dto/dns.dto';
import axios from 'axios';
import { Resolver } from 'dns/promises';

@Controller('dns')
export class DnsController {
  constructor(private readonly dnsService: DnsService) {}

  @Public()
  @Get()
  async getDns() {
    const dnsServers = [
      '8.8.8.8', // Google
      '1.1.1.1', // Cloudflare
      '208.67.222.222', // OpenDNS
    ];

    // async function checkGlobalPropagation(domain: string, expectedIP: string) {
    const domain = 'tofikkk.lol';
    const expectedIP = '95.182.115.218';
    const resolvers = ['8.8.8.8', '1.1.1.1', '208.67.222.222'];
    const results: boolean[] = [];

    for (const resolverIP of resolvers) {
      const resolver = new Resolver();
      resolver.setServers([resolverIP]);

      try {
        const addresses = await resolver.resolve4(domain);
        // Check if any returned IP matches your expected IP
        const matched = addresses.some((addr) => addr === expectedIP);
        results.push(matched);
        console.log(
          `Resolver ${resolverIP} => ${addresses.join(', ')} => match: ${matched}`,
        );
      } catch (err) {
        console.error(`Resolver ${resolverIP} error:`, err);
        results.push(false);
      }
    }

    // Decide your success criteria
    const successRate = results.filter(Boolean).length / resolvers.length;
    return successRate >= 0.8;
  }

  // return 'Hello world from the dns';

  @Public()
  @Post()
  async createDns(@Body() body: DNSDto) {
    try {
      /*
  should accept/inputs
  - project id
  - domain name
  
  hardcode the server ip for now

    1. create a zone
    2. create a DNS record
    3. fetch the project port from the database
    3.update the nginx config to include the new domain, port and then reload nginx container
    4. return the result
     */
      const zone = await this.dnsService.createZone(body.domain);
      this.dnsService.createDNSRecord(zone.id, body.domain, '95.182.115.218');
      this.dnsService.generateAndUploadCertificate(body.domain);

      this.dnsService.updateNginxConfigRemote(body.domain, 4173);
      this.dnsService.reloadNginxContainerRemote();
      return 'Hello world from the dns';
    } catch (error) {
      console.error('Error creating DNS:', error);
      return error;
    }
  }
}
