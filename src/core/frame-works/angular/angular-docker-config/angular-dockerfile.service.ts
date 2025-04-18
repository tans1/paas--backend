import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as ejs from 'ejs';
import * as fs from 'fs';
import * as path from 'path';
import { HttpException, HttpStatus } from '@nestjs/common';
import {PORT} from '../constants';
import * as semver from 'semver';
import stripJsonComments from 'strip-json-comments';

@Injectable()
export class AngularDockerfileService {
  constructor() {}

  async createDockerfile(projectConfig: {
    projectPath: string;
    nodeVersion?: string;
    defaultBuildLocation?: string;
  }): Promise<void> {
    const {
      projectPath,
      nodeVersion = '16',
      defaultBuildLocation
    } = projectConfig;
  
    try {
      const { ssrEnabled, entryFile} = await this.determineSSREntry(projectPath);
  
      const templateName = ssrEnabled 
        ? 'Dockerfile.SSR.ejs' 
        : 'Dockerfile.CSR.ejs';
  
      const templatePath = path.join(
        __dirname,
        'templates',
        templateName
      );
  
      const templateContent = await fs.promises.readFile(templatePath, 'utf-8');
  
      const dockerfileContent = ejs.render(templateContent, {
        nodeVersion,
        outputDir: defaultBuildLocation,
        PORT : PORT,
        entryFile : entryFile
      });
  
      const dockerFile = `Dockerfile.${process.env.DEPLOYMENT_HASH}`;
      const dockerfilePath = path.join(projectPath, dockerFile);
      await fs.promises.writeFile(dockerfilePath, dockerfileContent, 'utf-8');
  
    } catch (error) {
      console.error(`Error creating Dockerfile: ${error.message}`);
      throw new HttpException(
        `Error creating Dockerfile: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  
  private async checkForSSR(projectPath: string): Promise<boolean> {
    try {
      const serverFiles = [
        path.join(projectPath, 'server.ts'),
        path.join(projectPath, 'src', 'server.ts'),
        path.join(projectPath, 'projects', '*', 'server.ts')
      ];
      
      for (const file of serverFiles) {
        try {
          await fs.promises.access(file, fs.constants.F_OK);
          return true;
        } catch {/* Ignore not found */}
      }
    } catch (serverFileError) {
      return false;
    }
  
    try {
      const angularJsonPath = path.join(projectPath, 'angular.json');
      const angularJson = JSON.parse(await fs.promises.readFile(angularJsonPath, 'utf-8'));
  
      for (const projectName of Object.keys(angularJson.projects)) {
        const project = angularJson.projects[projectName];
        const buildTarget = project.architect?.build || project.targets?.build;
  
        if (!buildTarget) continue;
  
        // Check modern Angular 17+ SSR configuration
        if (buildTarget.options?.ssr?.entry) {
          return true;
        }
  
        // Check Angular 16+ with @angular/ssr
        if (buildTarget.options?.server) {
          return true;
        }
  
        // Check for SSR builders
        const ssrBuilders = [
          '@angular-devkit/build-angular:application',
          '@angular-devkit/build-angular:server',
          '@nguniversal/builders:ssr-dev-server'
        ];
        
        if (ssrBuilders.includes(buildTarget.builder)) {
          return true;
        }
  
        // Check for server target configuration
        const serverTarget = project.architect?.server || project.targets?.server;
        if (serverTarget && serverTarget.builder.includes('server')) {
          return true;
        }
  
        // Check production configuration for SSR hints
        const productionConfig = buildTarget.configurations?.production;
        if (productionConfig?.ssr || productionConfig?.outputMode === 'server') {
          return true;
        }
      }
  
      return false;
    } catch (error) {
      console.error('SSR detection error:', error);
      return false;
    }
  }

  private async determineSSREntry(projectPath: string): Promise<{ ssrEnabled: boolean; entryFile?: string }> {
    try {
      const ssrEnabled = await this.checkForSSR(projectPath);
      if (!ssrEnabled) return { ssrEnabled: false };
  
      const packageJsonPath = path.join(projectPath, 'package.json');
      const packageJson = JSON.parse(await fs.promises.readFile(packageJsonPath, 'utf-8')); 
      const angularVersion = semver.coerce(
        packageJson.dependencies['@angular/core'] || 
        packageJson.devDependencies['@angular/core']
      );
  
      const tsconfigPath = path.join(projectPath, 'tsconfig.json');
      let moduleFormat = 'commonjs';

      try {
        const tsconfigContent = await fs.promises.readFile(tsconfigPath, 'utf-8');
        const tsconfig = JSON.parse(stripJsonComments(tsconfigContent));
        moduleFormat = tsconfig.compilerOptions?.module?.toLowerCase() || moduleFormat;
      } catch {
        return { ssrEnabled: false };
      }
  
      const entryExt = this.getEntryExtension(angularVersion, moduleFormat);
      
      return {
        ssrEnabled: true,
        entryFile: `server.${entryExt}` 
      };
    } catch (error) {
      console.error('SSR entry determination error:', error);
      return { ssrEnabled: false };
    }
  }
  
  private getEntryExtension(angularVersion: semver.SemVer | null, moduleFormat: string): 'js' | 'mjs' {
    const normalizedModule = moduleFormat.toLowerCase();
    
    const isESModule = /^es\d{4}$|^esnext$/i.test(moduleFormat) || normalizedModule.includes('esm');
  
    if (angularVersion && semver.gte(angularVersion, '16.0.0')) {
      return isESModule ? 'mjs' : 'js';
    }
  
    return 'js';
  }

}
