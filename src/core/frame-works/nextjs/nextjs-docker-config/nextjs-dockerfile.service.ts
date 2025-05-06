import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as ejs from 'ejs';
import * as fs from 'fs';
import * as path from 'path';
import { HttpException, HttpStatus } from '@nestjs/common';
import { PORT } from '../constants';

@Injectable()
export class NextJsDockerfileService {
  private readonly logger = new Logger(NextJsDockerfileService.name);

  constructor() {}

  async createDockerfile(projectConfig: {
    projectPath: string;
    nodeVersion?: string;
    nextConfig: {
      output: 'standalone' | 'export' | null;
      useAppRouter: boolean;
      hasServerComponents: boolean;
    };
  }): Promise<void> {
    const {
      projectPath,
      nodeVersion = '18',
      nextConfig
    } = projectConfig;

    try {
      const templateName = this.determineTemplate(nextConfig);
      const templatePath = path.join(
        __dirname,
        'templates/nextjs',
        templateName
      );

      const templateContent = await fs.promises.readFile(templatePath, 'utf-8');
      const hasCustomServer = await this.checkCustomServer(projectPath);

      const dockerfileContent = ejs.render(templateContent, {
        nodeVersion,
        port: PORT,
        useAppRouter: nextConfig.useAppRouter,
        outputMode: nextConfig.output,
        hasCustomServer,
        projectPath
      });

      const dockerFilePath = path.join(projectPath, `Dockerfile.nextjs.${process.env.DEPLOYMENT_HASH}`);
      await fs.promises.writeFile(dockerFilePath, dockerfileContent, 'utf-8');

    } catch (error) {
      this.logger.error(`Dockerfile creation failed: ${error.message}`);
      throw new HttpException(
        `Error creating Dockerfile: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  private determineTemplate(nextConfig: any): string {
    if (nextConfig.output === 'export') {
      return 'static.Dockerfile.ejs';
    }
    if (nextConfig.output === 'standalone') {
      return 'standalone.Dockerfile.ejs';
    }
    return nextConfig.hasServerComponents ? 'app-router.Dockerfile.ejs' : 'default.Dockerfile.ejs';
  }

  private async checkCustomServer(projectPath: string): Promise<boolean> {
    const serverFiles = [
      'server.js',
      'server.mjs',
      'server.ts',
      'src/server.js',
      'src/server.ts'
    ];

    for (const file of serverFiles) {
      const fullPath = path.join(projectPath, file);
      if (fs.existsSync(fullPath)) return true;
    }
    return false;
  }
}