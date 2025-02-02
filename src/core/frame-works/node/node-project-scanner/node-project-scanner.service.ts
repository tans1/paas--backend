import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { EventNames } from 'src/core/events/event.module';
import { Framework } from '../../frameworks.enum';
import * as path from 'path';
import * as fs from 'fs';
import { FrameworkMap } from '../frameworks.constants';
@Injectable()
export class NodeProjectScannerService {
  constructor() {}

  async  scan(payload: any) {
    console.log('Scanning Node Project');
    const { projectPath, configFile } = payload;
    const packageJsonPath = path.join(projectPath, configFile);

    try {
      const packageJsonContent = await fs.promises.readFile(packageJsonPath, 'utf-8');
      const packageJson = JSON.parse(packageJsonContent);

      const nodeVersion = packageJson.engines?.node || 'latest';

      const dependencies = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies,
      };

      let detectedFramework = 'default';

      for (const [framework, { dependency }] of Object.entries(FrameworkMap)) {
        if (dependencies[dependency]) {
          detectedFramework = framework;
          break;
        }
      }

      const { buildCommand, startCommand,defaultBuildLocation } = FrameworkMap[detectedFramework];

      return {
        projectPath,
        nodeVersion,
        framework: detectedFramework,
        startCommand,
        buildCommand,
        defaultBuildLocation
      };
    } catch (error) {
      console.error(`Error scanning project: ${error.message}`);
      throw new Error('Failed to scan the Node project. Please ensure the project path and config file are correct.');
    }
  }
}
