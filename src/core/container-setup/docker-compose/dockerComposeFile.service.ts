import { Injectable } from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs';
import * as ejs from 'ejs';

@Injectable()
export class DockerComposeFileService {
  async createDockerComposeFile(
    projectPath: string,
    projectName: string,
    deploymentUrl: string,
    extension: string,
    PORT: number = 80,
    dockerFile?: string,
  ): Promise<[string, string, string]> {
    try {
      const templatePath = path.join(
        __dirname,
        'templates',
        'docker-compose.yml.ejs',
      );
      const templateContent = await fs.promises.readFile(templatePath, 'utf-8');

      const envFileName = `${projectName}.${extension}.env`;
      const envFilePath = path.join(projectPath, envFileName);

      const includeEnvFile = fs.existsSync(envFilePath);
      if (!dockerFile) {
        dockerFile = `Dockerfile.${process.env.DEPLOYMENT_HASH}`;
      }
      const imageName = `${process.env.DOCKER_USERNAME}/${projectName}`;
      const containerName = `${projectName}`;
      const dockerComposeFile = `docker-compose.${process.env.DEPLOYMENT_HASH}.yml`;
      const dockerComposeContent = ejs.render(templateContent, {
        projectName: projectName,
        deploymentUrl: deploymentUrl,
        envFileName: envFileName,
        includeEnvFile: includeEnvFile,
        dockerFile: dockerFile,
        imageName: imageName,
        containerName: containerName,
        PORT: PORT,
      });

      const dockerComposePath = path.join(projectPath, dockerComposeFile);
      await fs.promises.writeFile(
        dockerComposePath,
        dockerComposeContent,
        'utf-8',
      );
      return [
        `${imageName}:${extension}`,
        `${containerName}-${extension}`,
        dockerComposeFile,
      ];
    } catch (error) {
      console.error('Error creating Docker Compose file:', error);
      throw error; // Re-throw the error after logging
    }
  }
}
