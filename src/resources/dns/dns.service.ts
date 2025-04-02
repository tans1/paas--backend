import { Injectable } from '@nestjs/common';
import { CloudflareDNSRecord, CloudflareZone } from './types';

import Cloudflare from 'cloudflare';

@Injectable()
export class DnsService {
  private cloudflareApi;
  constructor() {
    this.cloudflareApi = new Cloudflare({
      apiEmail: process.env['CLOUDFLARE_EMAIL'],
      apiKey: process.env['CLOUDFLARE_API_KEY'],
    });
  }

  async createZone(domain: string): Promise<CloudflareZone | null> {
    try {
      const response = await this.cloudflareApi.zones.create({
        name: domain,
        jump_start: true,
      });

      return response;
    } catch (error: any) {
      throw error;
    }
  }
  getRootDomain(domain: string): string {
    const normalizedDomain = domain.toLowerCase();

    if (normalizedDomain.startsWith('www.')) {
      return normalizedDomain.slice(4);
    }
    return normalizedDomain;
  }
  async createDNSRecords(
    zoneId: string,
    domain: string,
    SERVER_IP: string,
  ): Promise<(CloudflareDNSRecord | null)[]> {
    try {
      const rootDomain = this.getRootDomain(domain);
      // TODO: Check if the records already exist
      const aRecord = await this.cloudflareApi.dns.records.create({
        zone_id: zoneId,
        type: 'A',
        name: rootDomain,
        content: SERVER_IP,
        ttl: 1,
        proxied: true,
      });

      const cnameRecord = await this.cloudflareApi.dns.records.create({
        zone_id: zoneId,
        type: 'CNAME',
        name: `www.${rootDomain}`,
        content: rootDomain,
        ttl: 1,
        proxied: true,
      });

      return [aRecord, cnameRecord];
    } catch (error: any) {
      throw error;
    }
  }

  async createDockerComposeFile(domain: string, port: number): Promise<void> {}

  async checkPropagation(
    domain: string,
    expectedIP: string,
  ): Promise<boolean> {}

  async runDockerCompose(domain: string, projectId: string): Promise<void> {}

  async verifyDomainAccessibility(domain: string): Promise<boolean> {}

  async notifyUser(domain: string, userId: string): Promise<void> {}

  async createDomainRedirection(
    domain: string,
    target: string,
  ): Promise<void> {}

  async deleteOldDNSRecords(domain: string): Promise<void> {}
}
