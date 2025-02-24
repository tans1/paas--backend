import { Injectable } from '@nestjs/common';
import { ImageBuildGateway } from '../Image-build-gateway';
import { AlsService } from '@/utils/als/als.service';
// import { DeploymentService } from './deployment.service';

@Injectable()
export class DockerLogService {
  constructor(
    private readonly imageBuildGateway: ImageBuildGateway,
    private readonly alsService: AlsService,
    // private readonly deploymentService: DeploymentService, // Inject DeploymentService
  ) {}

  async handleDockerStream(stream: NodeJS.ReadableStream, deploymentId?: number): Promise<void> {
    const repositoryId = this.alsService.getrepositoryId();
    return new Promise((resolve, reject) => {
      stream.on('data', async (chunk) => {
        const logMessage = chunk.toString();
        process.stdout.write(logMessage);
        console.log(logMessage);
        // Send log to the user via your gateway
        this.imageBuildGateway.sendLogToUser(repositoryId, logMessage);
        // Optionally, store the log in the database if deploymentId is provided
        if (deploymentId) {
          try {
            // await this.deploymentService.addDeploymentLog(deploymentId, 'info', logMessage);
          } catch (error) {
            console.error('Failed to store log in DB:', error);
          }
        }
      });
      stream.on('end', resolve);
      stream.on('error', reject);
    });
  }

  logMessage(message: string, deploymentId?: number): void {
    const repositoryId = this.alsService.getrepositoryId();
    console.log(message);
    this.imageBuildGateway.sendLogToUser(repositoryId, message);
    if (deploymentId) {
    //   this.deploymentService.addDeploymentLog(deploymentId, 'info', message).catch((error) => {
    //     console.error('Failed to store log in DB:', error);
    //   });
    }
  }
}
