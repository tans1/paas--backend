import { Injectable, Logger } from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class NestJsProjectScannerService {
  private readonly logger = new Logger(NestJsProjectScannerService.name);

  constructor() {}

  async scan(
    payload: any,
  ): Promise<{ projectPath: string; nodeVersion: string }> {
    const { projectPath, configFile } = payload;
    // configFile here is assumed to be the package.json file name (e.g. 'package.json')
    const packageJsonPath = path.join(projectPath, configFile);
    let packageJson: any;

    try {
      const packageJsonContent = await fs.promises.readFile(
        packageJsonPath,
        'utf-8',
      );
      packageJson = JSON.parse(packageJsonContent);
    } catch (err: any) {
      this.logger.error(
        `Error reading package.json at ${packageJsonPath}: ${err.message}`,
      );
      throw new Error(
        'Failed to read package.json. Please ensure the project path and config file are correct.',
      );
    }

    const nodeVersion = packageJson.engines?.node || '18';

    return {
      projectPath,
      nodeVersion,
    };
  }
}
