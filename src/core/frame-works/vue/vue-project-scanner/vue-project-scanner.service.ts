import { Injectable, Logger } from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class VueProjectScannerService {
  private readonly logger = new Logger(VueProjectScannerService.name);

  constructor() {}

  async scan(payload: any): Promise<{ projectPath: string; nodeVersion: string; defaultBuildLocation: string }> {
    const { projectPath, configFile } = payload;
    // configFile here is assumed to be the package.json file name (e.g. 'package.json')
    const packageJsonPath = path.join(projectPath, configFile);
    let packageJson: any;

    try {
      const packageJsonContent = await fs.promises.readFile(packageJsonPath, 'utf-8');
      packageJson = JSON.parse(packageJsonContent);
    } catch (err: any) {
      this.logger.error(`Error reading package.json at ${packageJsonPath}: ${err.message}`);
      throw new Error('Failed to read package.json. Please ensure the project path and config file are correct.');
    }

    const nodeVersion = packageJson.engines?.node || '18'; // Default to 18 if not specified
    let defaultBuildLocation = 'dist'; // Default build location for Vue projects

    // Determine the Vue configuration file.
    // Vue CLI projects typically use "vue.config.js", but some may use "vue.config.ts".
    const possibleConfigFiles = ['vue.config.js', 'vue.config.ts'];
    let vueConfigFilePath: string | null = null;
    for (const fileName of possibleConfigFiles) {
      const fullPath = path.join(projectPath, fileName);
      if (fs.existsSync(fullPath)) {
        vueConfigFilePath = fullPath;
        break;
      }
    }

    if (vueConfigFilePath) {
      try {
        /**
         * Using require() here is preferable to reading and JSON.parsing the file because
         * a typical vue.config.js exports a plain JavaScript object (or a function returning one),
         * and it may include comments or non‑JSON syntax.
         *
         * Note: if the config file is TypeScript (vue.config.ts), ensure that your environment
         * is set up to handle TS (for example, by registering ts-node) before using require().
         */
        const vueConfigModule = require(vueConfigFilePath);
        // Handle the case where the config is a function or a plain object.
        const vueConfig = typeof vueConfigModule === 'function' ? vueConfigModule() : vueConfigModule;
        if (vueConfig && vueConfig.outputDir) {
          defaultBuildLocation = vueConfig.outputDir;
        }
      } catch (err: any) {
        this.logger.error(`Error loading Vue configuration from ${vueConfigFilePath}: ${err.message}`);
        // Continue using the default build location ('dist') if the config cannot be loaded.
      }
    } else {
      this.logger.warn(`No vue.config.js or vue.config.ts found in ${projectPath}. Using default build location 'dist'.`);
    }

    return {
      projectPath,
      nodeVersion,
      defaultBuildLocation,
    };
  }
}
