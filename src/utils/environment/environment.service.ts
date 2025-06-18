import { Injectable, BadRequestException } from '@nestjs/common';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { readFile, writeFile } from 'fs/promises';
import { AlsService } from '../als/als.service';
import * as fs from 'fs';

@Injectable()
export class EnvironmentService {
  constructor(private alsService: AlsService) {}

  async processEnvironment(
    envVars?: string,
    envFile?: Express.Multer.File,
  ): Promise<Record<string, string>> {
    let fileEnv: Record<string, string> = {};
    let parsedEnvVars = envVars ? JSON.parse(envVars) : {};
    if (envFile) {
      try {
        fileEnv = dotenv.parse(envFile.buffer.toString());
      } catch (error) {
        throw new BadRequestException('Invalid environment file format');
      }
    }

    return { ...fileEnv, ...parsedEnvVars };
  }

  async addEnvironmentFile({
    environmentVariables,
    projectPath,
  }: {
    environmentVariables: Record<string, string>;
    projectPath: string;
  }) {
    const projectName = this.alsService.getprojectName();
    const extenstion = this.alsService.getExtension();
    const envFileName = `${projectName}.${extenstion}.env`;
    const envFilePath = path.join(projectPath, envFileName);
    const content = Object.entries(environmentVariables)
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');

    await writeFile(envFilePath, content, 'utf-8');
  }

  // let's just add a method that copys the current environment file and change's it's name

  async copyEnvironmentFile({
    projectPath,
    oldExtension,
  }: {
    projectPath: string;
    oldExtension: string;
  }) {
    const projectName = this.alsService.getprojectName();
    const extension = this.alsService.getExtension();

    const oldEnvFileName = `${projectName}.${oldExtension}.env`;
    const oldEnvFilePath = path.join(projectPath, oldEnvFileName);

    const newEnvFileName = `${projectName}.${extension}.env`;
    const newEnvFilePath = path.join(projectPath, newEnvFileName);

    try {
      // copy only if the old file exists
      const oldFileExists = fs.existsSync(oldEnvFilePath);
      if (oldFileExists){
        await writeFile(newEnvFilePath, await readFile(oldEnvFilePath), 'utf-8');
      }
    } catch (error) {
      throw new BadRequestException('Failed to copy environment file');
    }
  }
}
