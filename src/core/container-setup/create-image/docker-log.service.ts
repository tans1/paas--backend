import { Injectable } from '@nestjs/common';
import { ImageBuildGateway } from '../gateway/image-build/Image-build-gateway';
import { AlsService } from '@/utils/als/als.service';
import {
  DeploymentRepositoryInterface,
  CreateDeploymentLogDTO,
} from '../../../infrastructure/database/interfaces/deployment-repository-interface/deployment-repository-interface.interface';
@Injectable()
export class DockerLogService {
  constructor(
    private readonly imageBuildGateway: ImageBuildGateway,
    private readonly alsService: AlsService,
    private deploymentRepositoryService: DeploymentRepositoryInterface,
  ) {}

  async handleDockerStream(
    stream: NodeJS.ReadableStream,
    repositoryId: number,
    branch: string,
    logType: string,
    deploymentId: number,
  ): Promise<void> {
    let buffer = '';

    return new Promise((resolve, reject) => {
      stream.setEncoding('utf8');

      stream.on('data', async (chunk) => {
        buffer += chunk;
        let newlineIndex;

        while ((newlineIndex = buffer.indexOf('\n')) >= 0) {
          const line = buffer.slice(0, newlineIndex + 1);
          buffer = buffer.slice(newlineIndex + 1);

          process.stdout.write(line);
          console.log(line.trim());
          this.imageBuildGateway.sendLogToUser(
            repositoryId,
            branch,
            logType,
            line,
          );

          if (deploymentId) {
            try {
              await this.logMessage(
                line,
                repositoryId,
                branch,
                logType,
                deploymentId,
              );
            } catch (error) {
              console.error('Failed to store log in DB:', error);
            }
          }
        }
      });

      stream.on('end', () => {
        if (buffer.length > 0) {
          process.stdout.write(buffer);
          console.log(buffer.trim());
          this.imageBuildGateway.sendLogToUser(
            repositoryId,
            branch,
            logType,
            buffer,
          );

          if (deploymentId) {
            this.logMessage(
              buffer,
              repositoryId,
              branch,
              logType,
              deploymentId,
            ).catch((error) => {
              console.error('Failed to store final log in DB:', error);
            });
          }
        }
        resolve();
      });

      stream.on('error', reject);
    });
  }
  async logMessage(
    message: string,
    repositoryId: number,
    branch: string,
    logType,
    deploymentId?: number,
    complete = false,
  ) {
    this.imageBuildGateway.sendLogToUser(
      repositoryId,
      branch,
      logType,
      message,
      complete,
    );

    const createDeploymentLogDTO: CreateDeploymentLogDTO = {
      deploymentId: deploymentId,
      logLevel: 'info',
      message: message,
      logType: logType,
    };

    if (deploymentId) {
      await this.deploymentRepositoryService.addLog(createDeploymentLogDTO);
    }
  }
}
