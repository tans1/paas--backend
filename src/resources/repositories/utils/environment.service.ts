import { Injectable, BadRequestException } from '@nestjs/common';
import * as dotenv from 'dotenv';

@Injectable()
export class EnvironmentService {
  constructor() {}

  async processEnvironment(
    envVars?: string,
    envFile?: Express.Multer.File,
  ): Promise<Record<string, string>> {
    let fileEnv: Record<string, string> = {};
    let parsedEnvVars = JSON.parse(envVars);
    if (envFile) {
      try {
        fileEnv = dotenv.parse(envFile.buffer.toString());
      } catch (error) {
        throw new BadRequestException('Invalid environment file format');
      }
    }

    return { ...fileEnv, ...parsedEnvVars };
  }
}
