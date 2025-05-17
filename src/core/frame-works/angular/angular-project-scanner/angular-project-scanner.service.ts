import { Injectable, Logger } from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class AngularProjectScannerService {
  private readonly logger = new Logger(AngularProjectScannerService.name);

  constructor() {}

  async scan(payload: any): Promise<{
    projectPath: string;
    nodeVersion: string;
    defaultBuildLocation: string;
  }> {
    const { projectPath, configFile } = payload;
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

    const nodeVersion = packageJson.engines?.node || '18'; // Default to 18 if not specified

    const angularConfig = require(path.join(projectPath, 'angular.json'));
    const defaultProject =
      angularConfig.defaultProject || Object.keys(angularConfig.projects)[0];
    const defaultBuildLocation =
      angularConfig.projects[defaultProject]?.architect?.build?.options
        ?.outputPath || 'dist';

    return {
      projectPath,
      nodeVersion,
      defaultBuildLocation: defaultBuildLocation,
    };
  }
}
