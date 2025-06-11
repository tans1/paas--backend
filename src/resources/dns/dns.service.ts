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
import {
  CreateDNSRecordsFaildException,
  UpdateSSLSettingException,
} from '@/utils/exceptions/github.exception';
import { NotificationQueueService } from '../notification/notification-queue.service';
import {
  Notification,
  NotificationPriority,
  NotificationType
} from '@prisma/client';
const execAsync = promisify(exec);
@Injectable()
export class DnsService {
  private cloudflareApi;
  constructor(
    private readonly projectsRepositoryService: ProjectsRepositoryInterface,
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
    private readonly notificationQueueService: NotificationQueueService,
  ) {
    this.cloudflareApi = new Cloudflare({
      apiEmail: process.env['CLOUDFLARE_EMAIL'],
      apiKey: process.env['CLOUDFLARE_API_KEY'],
    });
  }

  async recordExists(
    zoneId: string,
    type: string,
    name: string,
  ): Promise<CloudflareDNSRecord | null> {
    const response = await this.cloudflareApi.dns.records.list({
      zone_id: zoneId,
    });
    const records = response.result || [];
    const record = records.find(
      (r: CloudflareDNSRecord) => r.type === type && r.name === name,
    );

    return record || null;
  }
  private getRootDomain(domain: string): string {
    const normalizedDomain = domain.toLowerCase();

    if (normalizedDomain.startsWith('www.')) {
      return normalizedDomain.slice(4);
    }
    return normalizedDomain;
  }
  async createZone(domain: string): Promise<CloudflareZone> {
    try {
      const rootDomain = this.getRootDomain(domain);

      const existingZones = await this.cloudflareApi.zones.list({
        name: rootDomain,
        // status: 'active',
      });

      if (existingZones.result?.length > 0) {
        this.logger.log(`Found existing zone for ${rootDomain}`);
        return existingZones.result[0];
      }
      const response = await this.cloudflareApi.zones.create({
        name: rootDomain,
        jump_start: true,
      });

      if (!response?.id) {
        throw new Error('Zone creation failed: No ID returned from Cloudflare');
      }

      this.logger.log(`Successfully created new zone for ${rootDomain}`);
      return response;
    } catch (error: any) {
      this.logger.error(
        `Zone operation failed for ${domain}: ${error.message}`,
      );
      throw new Error(`Zone operation failed: ${error.message}`);
    }
  }

  async createDNSRecords(
    zoneId: string,
    domain: string,
  ): Promise<(CloudflareDNSRecord | null)[]> {
    try {
      const SERVER_IP = process.env['SERVER_IP'];
      const rootDomain = this.getRootDomain(domain);

      let aRecord = await this.recordExists(zoneId, 'A', rootDomain);
      if (!aRecord) {
        aRecord = await this.cloudflareApi.dns.records.create({
          zone_id: zoneId,
          type: 'A',
          name: rootDomain,
          content: SERVER_IP,
          ttl: 1,
          proxied: true,
        });
      }

      let cnameRecord = await this.recordExists(
        zoneId,
        'CNAME',
        `www.${rootDomain}`,
      );
      if (!cnameRecord) {
        cnameRecord = await this.cloudflareApi.dns.records.create({
          zone_id: zoneId,
          type: 'CNAME',
          name: `www.${rootDomain}`,
          content: rootDomain,
          ttl: 1,
          proxied: true,
        });
      }
      return [aRecord, cnameRecord];
    } catch (error: any) {
      this.logger.error(
        `Error creating DNS records for domain ${domain}: ${error.message}`,
      );
      throw new CreateDNSRecordsFaildException();
    }
  }

  async updateSSLSetting(zoneId, mode = "strict") {
    try {
      const response = await this.cloudflareApi.zones.settings.edit('ssl',
        {
        zone_id : zoneId,
        },
        {
          body : { value: mode},
        }
      );
      console.log('SSL setting updated:', response);
    } catch (error) {
      console.error('Full error:', error);
    }
  }
  // async createDockerComposeFile(
  //   domain: string,
  //   projectId: number,
  // ): Promise<void> {
  //   const projectPath = (
  //     await this.projectsRepositoryService.findById(projectId)
  //   ).localRepoPath;
  //   const rootDomain = this.getRootDomain(domain);
  //   const templatePath = path.join(
  //     __dirname,
  //     '..',
  //     '..',
  //     'core',
  //     'container-setup',
  //     'create-image',
  //     'templates',
  //     'docker-compose.yml.ejs',
  //   );
  //   const templateContent = await fs.promises.readFile(templatePath, 'utf-8');
  //   const projectName = rootDomain
  //     .toLowerCase()
  //     .replace(/[^a-z0-9-]/g, '-')
  //     .replace(/^-+/, '')
  //     .replace(/-+$/, '')
  //     .replace(/-{2,}/g, '-');
  //   const dockerComposeContent = ejs.render(templateContent, {
  //     projectName,
  //     deploymentUrl: rootDomain,
  //     includeEnvFile: false,
  //   });
  //   const dockerComposeFileName = `docker-compose.${rootDomain}.yml`;
  //   const dockerComposePath = path.join(projectPath, dockerComposeFileName);
  //   await fs.promises.writeFile(
  //     dockerComposePath,
  //     dockerComposeContent,
  //     'utf-8',
  //   );
  // }

  async addTraeficConfigFile(domain: string, projectId: number): Promise<void> {
    const { name: projectName, PORT } =
      await this.projectsRepositoryService.findById(projectId);
    const rootDomain = this.getRootDomain(domain);
    const traefikDynamicPath = path.join(
      __dirname,
      '..',
      '..',
      '..',
      'traefik-dynamic',
    );

    const templatePath = path.join(
      traefikDynamicPath,
      'template',
      'domain.config.ejs',
    );
    const templateContent = await fs.promises.readFile(templatePath, 'utf-8');
    // const projectName = rootDomain
    //   .toLowerCase()
    //   .replace(/[^a-z0-9-]/g, '-')
    //   .replace(/^-+/, '')
    //   .replace(/-+$/, '')
    //   .replace(/-{2,}/g, '-');
    const domainConfigContent = ejs.render(templateContent, {
      projectName,
      rootDomain,
      PORT,
    });
    const domainConfigFileName = `domain-config.${rootDomain}.yml`;
    const domainConfigFilePath = path.join(
      traefikDynamicPath,
      domainConfigFileName,
    );
    await fs.promises.writeFile(
      domainConfigFilePath,
      domainConfigContent,
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

  // async runDockerCompose(domain: string, projectId: number): Promise<void> {
  //   const rootDomain = this.getRootDomain(domain);

  //   const projectName = rootDomain.replace(/\./g, '-');
  //   const dockerComposeFileName = `docker-compose.${rootDomain}.yml`;
  //   // const command = `docker compose -f ${dockerComposeFileName} up -d --build`;
  //   const command = `docker compose -p ${projectName} -f ${dockerComposeFileName} up -d --build --remove-orphans`;

  //   const projectPath = (
  //     await this.projectsRepositoryService.findById(projectId)
  //   ).localRepoPath;
  //   const { stdout, stderr } = await execAsync(command, { cwd: projectPath });
  //   if (stdout) {
  //     this.logger.log(`stdout: ${stdout}`);
  //   }
  //   if (stderr) {
  //     this.logger.error(`stderr: ${stderr}`);
  //   }
  // }

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
    // Send notification
    if (userId) {
      await this.notificationQueueService.enqueueNotification({
        title: 'Domain Propagation',
        message: message,
        type: NotificationType.SYSTEM,
        priority: NotificationPriority.HIGH,
        userId: Number(userId)
      });
    }
    console.log(
      `user : ${userId} , the domain names is resolved and you can access it now using ${domain}`,
    );
    if (message) {
      console.log(message);
    }
  }
}
