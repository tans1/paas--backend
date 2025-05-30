import { Injectable, Logger } from '@nestjs/common';
import { spawn } from 'child_process';
import { readFileSync } from 'fs';
import { join } from 'path';
import * as dotenv from 'dotenv';

@Injectable()
export class DockerComposeService {
  readonly logger = new Logger(DockerComposeService.name);

  private execDockerCommand(
    args: string[],
    projectPath: string,
    envVars: Record<string, string> = {},
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const proc = spawn('docker', args, {
        cwd: projectPath,
        stdio: 'inherit',
        env: { ...process.env, ...envVars },
      });

      proc.on('error', err =>
        reject(new Error(`Failed to execute docker command: ${err.message}`))
      );
      proc.on('exit', code =>
        code === 0
          ? resolve()
          : reject(new Error(`docker ${args.join(' ')} exited with ${code}`))
      );
    });
  }

  async up(
    projectPath: string,
    dockerComposeFile: string,
    extension: string,
    projectName: string,
  ): Promise<void> {
    const envFile = join(
      projectPath,
      `${projectName}.${extension}.env`
    );

    const envContent = readFileSync(envFile, 'utf-8');
    const parsed = dotenv.parse(envContent);

    parsed.EXTENSION = extension;

    await this.execDockerCommand(
      ['compose', '-f', dockerComposeFile, 'up', '-d'],
      projectPath,
      parsed,
    );
  }
}
