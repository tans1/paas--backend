import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import * as Docker from 'dockerode';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { DockerLogService } from './docker-log.service';
import { FileService } from './file.service';

@Injectable()
export class ImageBuildService {
  private docker: Docker;

  constructor(
    private readonly dockerLogService: DockerLogService,
    private readonly fileService: FileService,
  ) {
    this.docker = new Docker();
  }

  async buildImage(projectPath: string): Promise<string> {
    // Generate a unique image name
    const imageName = `imagename-${uuidv4()}`.toLowerCase();
    console.log(`Building Docker image: ${imageName}`);

    try {
      // Resolve the absolute path
      const resolvedTarPath = path.resolve(projectPath);
      console.log(`Resolved tar path: ${resolvedTarPath}`);

      // Get files from directory and filter by .gitignore
      let files = this.fileService.getRootFileNames(resolvedTarPath);
      files = this.fileService.parseGitignore(resolvedTarPath, files);
      console.log('Files included in the build context:', files);

      // Build the image using Docker
      const stream = await this.docker.buildImage(
        { context: resolvedTarPath, src: files },
        { t: imageName },
      );

      await this.dockerLogService.handleDockerStream(stream);
      console.log(`Docker image '${imageName}' created successfully.`);

      return imageName;
    } catch (error) {
      console.error('Docker error in buildImage:', error);
      if (error.statusCode) {
        throw new HttpException(
          `Docker error: ${error.message}`,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
      if (error.code === 'ENOENT') {
        throw new HttpException(
          `File not found: ${error.message}`,
          HttpStatus.BAD_REQUEST,
        );
      }
      throw new HttpException(
        `Unexpected error: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
