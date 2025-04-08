import { Injectable, Inject, LoggerService } from '@nestjs/common';
import { CloudflareDNSRecord, CloudflareZone } from './types';

import Cloudflare from 'cloudflare';

import * as path from 'path';
import { exec } from 'child_process';

import { promisify } from 'util';
import * as fs from 'fs';
import * as ejs from 'ejs';

import { isIP } from 'net';
import { promises as dnsPromises } from 'dns';

import * as https from 'https';

import fetch, { RequestInit } from 'node-fetch';
import { ProjectsRepositoryInterface } from '../../infrastructure/database/interfaces/projects-repository-interface/projects-repository-interface.interface';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

const execAsync = promisify(exec);
@Injectable()
export class DnsService {
  private cloudflareApi;
  constructor(
    private readonly projectsRepositoryService: ProjectsRepositoryInterface,
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
  ) {
    this.cloudflareApi = new Cloudflare({
      apiEmail: process.env['CLOUDFLARE_EMAIL'],
      apiKey: process.env['CLOUDFLARE_API_KEY'],
    });
  }
  private getRootDomain(domain: string): string {
    const normalizedDomain = domain.toLowerCase();

    if (normalizedDomain.startsWith('www.')) {
      return normalizedDomain.slice(4);
    }
    return normalizedDomain;
  }
  async createZone(domain: string): Promise<CloudflareZone | null> {
    try {
      const rootDomain = this.getRootDomain(domain);
      const response = await this.cloudflareApi.zones.create({
        name: rootDomain,
        jump_start: true,
      });

      return response;
    } catch (error: any) {
      this.logger.error(
        `Error creating Cloudflare zone for domain ${domain}: ${error.message}`,
      );
      throw error;
    }
  }

  async createDNSRecords(
    zoneId: string,
    domain: string,
  ): Promise<(CloudflareDNSRecord | null)[]> {
    try {
      const SERVER_IP = process.env['SERVER_IP'];
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
      this.logger.error(
        `Error creating DNS records for domain ${domain}: ${error.message}`,
      );
      throw error;
    }
  }

  async createDockerComposeFile(
    domain: string,
    projectId: number,
  ): Promise<void> {
    const projectPath = (
      await this.projectsRepositoryService.findById(projectId)
    ).localRepoPath;
    const rootDomain = this.getRootDomain(domain);
    const templatePath = path.join(
      __dirname,
      'templates',
      'docker-compose.yml.ejs',
    );
    const templateContent = await fs.promises.readFile(templatePath, 'utf-8');
    const dockerComposeContent = ejs.render(templateContent, {
      projectName: rootDomain,
      deploymentUrl: rootDomain,
    });
    const dockerComposeFileName = `docker-compose.${rootDomain}.yml`;
    const dockerComposePath = path.join(projectPath, dockerComposeFileName);
    await fs.promises.writeFile(
      dockerComposePath,
      dockerComposeContent,
      'utf-8',
    );
  }

  async checkPropagation(
    domain: string,
    expectedIP: string,
    expectedNameservers: string[],
    timeout: number = 5000,
  ): Promise<boolean> {
    const ipVersion = isIP(expectedIP);
    if (ipVersion !== 4 && ipVersion !== 6) {
      return false;
    }

    try {
      const resolver =
        ipVersion === 4 ? dnsPromises.resolve4 : dnsPromises.resolve6;
      const records = (await Promise.race([
        resolver(domain, { ttl: true }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('DNS timeout')), timeout),
        ),
      ])) as Array<{ address: string }>;

      if (records.length == 0) {
        return false;
      }
    } catch (err) {
      this.logger.error(
        `Error resolving DNS for domain ${domain}: ${err.message}`,
      );
      return false;
    }

    try {
      // const expectedNameservers = [
      //   'damiete.ns.cloudflare.com',
      //   'marlowe.ns.cloudflare.com',
      // ];

      const nsRecords = (await Promise.race([
        dnsPromises.resolveNs(domain),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('NS lookup timeout')), timeout),
        ),
      ])) as string[];

      if (!nsRecords || nsRecords.length === 0) {
        return false;
      }

      const nsAreValid = expectedNameservers.every((expectedNs) =>
        nsRecords.some((nsRecord) =>
          nsRecord.toLowerCase().includes(expectedNs.toLowerCase()),
        ),
      );

      if (!nsAreValid) {
        return false;
      }
    } catch (err) {
      this.logger.error(
        `Error resolving NS records for domain ${domain}: ${err.message}`,
      );
      return false;
    }

    const protocols = ['https', 'http'];
    const options: RequestInit = {
      method: 'HEAD',
      headers: {
        Host: domain,
        'User-Agent': 'PropagationChecker/1.0',
      },
      redirect: 'manual',
      timeout,
    };

    for (const protocol of protocols) {
      try {
        const url = `${protocol}://${expectedIP}`;
        const agent =
          protocol === 'https'
            ? new https.Agent({ rejectUnauthorized: true })
            : undefined;

        const response = await fetch(url, { ...options, agent });
        if (response) {
          return true;
        }
      } catch (err) {
        console.log(err);
        continue;
      }
    }
    return false;
  }

  async runDockerCompose(domain: string, projectId: number): Promise<void> {
    const rootDomain = this.getRootDomain(domain);
    const dockerComposeFileName = `docker-compose.${rootDomain}.yml`;
    const command = `docker compose -f ${dockerComposeFileName} up -d --build`;

    const projectPath = (
      await this.projectsRepositoryService.findById(projectId)
    ).localRepoPath;
    const { stdout, stderr } = await execAsync(command, { cwd: projectPath });
    if (stdout) {
      this.logger.log(`stdout: ${stdout}`);
    }
    if (stderr) {
      this.logger.error(`stderr: ${stderr}`);
    }

    //  TODO: Deployment status and log
  }

  async createDomainRedirection(
    newDomain: string,
    projectId: number,
  ): Promise<void> {
    try {
      const oldDomain = (
        await this.projectsRepositoryService.findById(projectId)
      ).deployedUrl;
      const newRootDomain = this.getRootDomain(newDomain);

      const zoneId = await this.getZoneId(oldDomain);

      await this.cloudflareApi.zones.rulesets.create(zoneId, {
        name: `Redirect ${oldDomain} to ${newDomain}`,
        description: `301 redirect from ${oldDomain} to ${newDomain}`,
        kind: 'zone',
        phase: 'http_request_dynamic_redirect',
        rules: [
          {
            action: 'redirect',
            action_parameters: {
              from_value: {
                status_code: 301,
                target_url: {
                  value: `https://${newRootDomain}/$1`,
                },
              },
            },
            expression: `(http.host eq "${oldDomain}") or (http.host eq "www.${oldDomain}")`,
            description: `Redirect ${oldDomain} to ${newDomain}`,
          },
        ],
      });

      const newZoneId = await this.getZoneId(newRootDomain);
      const newZoneSettings =
        await this.cloudflareApi.zones.settings.read(newZoneId);

      if (
        !newZoneSettings.result.ssl ||
        newZoneSettings.result.ssl.status !== 'active'
      ) {
        await this.cloudflareApi.zones.edgeCertificates.prioritize(newZoneId, {
          certificates: [newZoneSettings.result.ssl.id],
        });
      }
    } catch (error) {
      throw new Error(`Redirection setup failed: ${error.message}`);
    }
  }

  private async getZoneId(domain: string): Promise<string> {
    const zones = await this.cloudflareApi.zones.list({ name: domain });
    if (!zones.result.length) {
      throw new Error(`Cloudflare zone not found for domain: ${domain}`);
    }
    return zones.result[0].id;
  }

  async deleteOldDNSRecords(projectId: number): Promise<void> {
    const project = await this.projectsRepositoryService.findById(projectId);
    const zoneId = project.zoneId;
    const aRecordId = project.aRecordId;
    const cnameRecordId = project.cnameRecordId;
    if (!zoneId || !aRecordId || !cnameRecordId) {
      throw new Error('Zone ID or DNS Record IDs not found in the database');
    }

    const aRecordDeleteResponse = await this.cloudflareApi.dns.records.delete(
      aRecordId,
      {
        zoneId,
      },
    );
    const cnameRecordDeleteResponse =
      await this.cloudflareApi.dns.records.delete(cnameRecordId, {
        zoneId,
      });

    console.log(aRecordDeleteResponse, cnameRecordDeleteResponse);
  }

  async notifyUser(
    domain: string,
    userId: string,
    projectId: number,
    zoneId: string,
    aRecordId: string,
    cnameRecordId: string,
    message: string,
  ): Promise<void> {
    await this.projectsRepositoryService.update(projectId, {
      zoneId,
      aRecordId,
      cnameRecordId,
    });
    console.log(
      `user : ${userId} , the domain names is resolved and you can access it now using ${domain}`,
    );
    if (message) {
      console.log(message);
    }
  }
}
