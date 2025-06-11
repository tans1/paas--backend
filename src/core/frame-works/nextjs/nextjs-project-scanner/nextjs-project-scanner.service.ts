import { Injectable, Logger } from '@nestjs/common';
import loadConfig from 'next/dist/server/config';
import { PHASE_PRODUCTION_BUILD } from 'next/constants';
import * as path from 'path';
import { readFile } from 'fs/promises';

@Injectable()
export class NextJsProjectScannerService {
  private readonly logger = new Logger(NextJsProjectScannerService.name);

  constructor() {
    // Optional: Verify Next.js is available at startup
    try {
      require.resolve('next');
    } catch (error) {
      throw new Error('Next.js is not installed. Run: npm install next');
    }
  }

  async scan(payload: { projectPath: string }): Promise<{
    projectPath: string;
    nodeVersion: string;
    output: "standalone" | "export" | undefined,
    distDir: string
  }> {
    const { projectPath } = payload;

    try {
      // 1. Load Next.js config
      const nextConfig = await loadConfig(PHASE_PRODUCTION_BUILD, projectPath);

      // 2. Read package.json
      const packageJson = await this.readPackageJson(projectPath);

      // 3. Return structured results
      return {
        projectPath,
        nodeVersion: packageJson.engines?.node,
        output: nextConfig.output || null,
        distDir: nextConfig.distDir
      };
    } catch (error) {
      this.logger.error(`Scan failed: ${error.message}`);
      throw new Error(`Next.js validation failed: ${error.message}`);
    }
  }

  private async readPackageJson(projectPath: string): Promise<any> {
    try {
      const pkgPath = path.join(projectPath, 'package.json');
      const content = await readFile(pkgPath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      throw new Error(`Failed to read package.json: ${error.message}`);
    }
  }
}
