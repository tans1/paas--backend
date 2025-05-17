import { Injectable } from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs';
import { BundlerMap } from '../bundler.constants';
@Injectable()
export class ReactProjectScannerService {
  constructor() {}

  async scan(payload: any) {
    console.log('Scanning react Project');
    const { projectPath, configFile } = payload;
    const packageJsonPath = path.join(projectPath, configFile);

    try {
      const packageJsonContent = await fs.promises.readFile(
        packageJsonPath,
        'utf-8',
      );
      const packageJson = JSON.parse(packageJsonContent);

      const nodeVersion = packageJson.engines?.node || '18'; // Default to 18 if not specified

      const dependencies = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies,
      };

      let projectBundler = 'webpack';

      for (const [bundler, { dependancy }] of Object.entries(BundlerMap)) {
        if (dependencies[dependancy]) {
          projectBundler = bundler;
          break;
        }
      }

      let defaultBuildLocation =
        BundlerMap[projectBundler].defaultBuildLocation;
      return {
        projectPath,
        nodeVersion,
        defaultBuildLocation,
      };
    } catch (error) {
      console.error(`Error scanning project: ${error.message}`);
      throw new Error(
        'Failed to scan the react project. Please ensure the project path and config file are correct.',
      );
    }
  }
}
