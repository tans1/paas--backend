import { Injectable } from '@nestjs/common';
import { ImageBuildGateway } from '../Image-build-gateway';
import { AlsService } from '@/utils/als/als.service';
import { DeploymentRepositoryInterface,CreateDeploymentLogDTO} from '@/infrastructure/database/interfaces/deployment-repository-interface/deployment-repository-interface.interface';
// import { DeploymentService } from './deployment.service';
@Injectable()
export class DockerLogService {
  constructor(
    private readonly imageBuildGateway: ImageBuildGateway,
    private readonly alsService: AlsService,
    private deploymentRepositoryService: DeploymentRepositoryInterface,
  ) {}

  // TODO: Maybe format the log message a bit better.
  async handleDockerStream(stream: NodeJS.ReadableStream, deploymentId?: number): Promise<void> {
    const repositoryId = this.alsService.getrepositoryId();
    return new Promise((resolve, reject) => {
      stream.on('data', async (chunk) => {
        const logMessage = chunk.toString();
        process.stdout.write(logMessage);
        console.log(logMessage);
        this.imageBuildGateway.sendLogToUser(repositoryId, logMessage);
        if (deploymentId) {
          try {
            await this.logMessage(logMessage,deploymentId);
          } catch (error) {
            console.error('Failed to store log in DB:', error);
          }
        }
      });
      stream.on('end', resolve);
      stream.on('error', reject);
    });
  }

  async logMessage(message: string, deploymentId?: number) {
    const repositoryId = this.alsService.getrepositoryId();
    // console.log(message);
    this.imageBuildGateway.sendLogToUser(repositoryId, message);

    const createDeploymentLogDTO:CreateDeploymentLogDTO = {
      deploymentId: deploymentId,
      logLevel: 'info',
      message: message,
    }

    if (deploymentId) {
      this.deploymentRepositoryService.addLog(createDeploymentLogDTO);

    }
  }
}

