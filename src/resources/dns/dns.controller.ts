import { Body, Controller, Get, Post } from '@nestjs/common';
import { DnsService } from './dns.service';
import { Public } from '../auth/public-strategy';
import { DNSDto } from './dto/dns.dto';
// import { Resolver } from 'dns/promises';
import axios from 'axios';
@Controller('dns')
export class DnsController {
  constructor(private readonly dnsService: DnsService) {}

  @Public()
  @Get()
  async getDns(): Promise<any> {
    const domain = 'tofikkk.lol';
    const expectedIp = '95.182.115.218';
    // Define the interface directly if needed
    interface AxiosResponse<T = any> {
      data: T;
      status: number;
      statusText: string;
      headers: any;
      config: any;
      request?: any;
    }

    interface DNSRecord {
      name: string;
      type: number;
      TTL: number;
      data: string;
    }

    interface DNSResponse {
      Status: number;
      TC: boolean;
      RD: boolean;
      RA: boolean;
      AD: boolean;
      CD: boolean;
      Question: Array<{
        name: string;
        type: number;
      }>;
      Answer?: DNSRecord[];
    }

    // async function checkGlobalDNSPropagation(
    //   domain: string,
    //   expectedIp: string,
    // ) {
    const providers = [
      'https://dns.google/resolve',
      'https://cloudflare-dns.com/dns-query',
    ];

    const results = await Promise.allSettled(
      providers.map((url) =>
        axios.get<DNSResponse>(url, {
          params: {
            name: domain,
            type: 'A',
          },
          headers: { Accept: 'application/dns-json' },
        }),
      ),
    );

    return results.filter(
      (result): result is PromiseFulfilledResult<AxiosResponse<DNSResponse>> =>
        result.status === 'fulfilled' &&
        result.value.data.Answer?.some((record) => record.data === expectedIp),
    );
    // }

    // Usage example
    // (async () => {
    //   const domain = 'tofikkk.lol';
    //   const expectedIp = '95.182.115.218';

    //   const propagationResults = await checkGlobalDNSPropagation(
    //     domain,
    //     expectedIp,
    //   );

    //   console.log(
    //     `Propagation confirmed on ${propagationResults.length} DNS providers`,
    //   );
    //   propagationResults.forEach((result) => {
    //     console.log(`- ${result.value.config.url}`);
    //   });
    // })();
  }

  @Public()
  @Post()
  async createDns(@Body() body: DNSDto) {
    try {
      const zone = await this.dnsService.createZone(body.domain);
      this.dnsService.createDNSRecord(zone.id, body.domain, '95.182.115.218');
    } catch (error) {
      console.error('Error creating DNS:', error);
      return error;
    }
  }
}
