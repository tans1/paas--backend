import { Injectable } from '@nestjs/common';
import { ImageBuildGateway } from '../Image-build-gateway';
import { AlsService } from '../../../utils/als/als.service';
import { DeploymentRepositoryInterface,CreateDeploymentLogDTO} from '../../../infrastructure/database/interfaces/deployment-repository-interface/deployment-repository-interface.interface';
@Injectable()
export class DockerLogService {
  constructor(
    private readonly imageBuildGateway: ImageBuildGateway,
    private readonly alsService: AlsService,
    private deploymentRepositoryService: DeploymentRepositoryInterface,
  ) {}

  async handleDockerStream(stream: NodeJS.ReadableStream, deploymentId?: number): Promise<void> {
    const repositoryId = this.alsService.getrepositoryId();
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
                this.imageBuildGateway.sendLogToUser(repositoryId, line);

                if (deploymentId) {
                    try {
                        await this.logMessage(line, deploymentId);
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
                this.imageBuildGateway.sendLogToUser(repositoryId, buffer);
                
                if (deploymentId) {
                    this.logMessage(buffer, deploymentId).catch(error => {
                        console.error('Failed to store final log in DB:', error);
                    });
                }
            }
            resolve();
        });

        stream.on('error', reject);
    });
  }
  async logMessage(message: string, deploymentId?: number) {
    const repositoryId = this.alsService.getrepositoryId();
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

