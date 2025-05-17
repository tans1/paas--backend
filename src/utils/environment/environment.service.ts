import { Injectable, BadRequestException } from '@nestjs/common';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { writeFile } from 'fs/promises';
import { AlsService } from '../als/als.service';

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
    const envFileName = `${projectName}.${process.env.DEPLOYMENT_HASH}.env`;
    const envFilePath = path.join(projectPath, envFileName);
    const content = Object.entries(environmentVariables)
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');

    await writeFile(envFilePath, content, 'utf-8');
  }
}
