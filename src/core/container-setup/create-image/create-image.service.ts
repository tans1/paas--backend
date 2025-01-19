import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { EventNames } from 'src/core/events/event.module';
import * as Docker from 'dockerode';
import * as path from 'path';
import * as fs from 'fs';
import ignore from 'ignore';

@Injectable()
export class CreateImageService {
  private docker: Docker;

  constructor() {
    this.docker = new Docker(); 
  }

  @OnEvent(EventNames.DOCKERFILE_GENERATED)
  async createImage(payload: { projectPath: string; imageName: string }) {
    const { projectPath, imageName } = payload;
    console.log('Creating Docker image...');
  
    try {
      const tarPath = path.resolve(projectPath);
      console.log(`Building image from ${tarPath} with name: ${imageName}`);
  
      let files = this.getRootFileNames(tarPath);
      const gitIgnoreFile = path.join(projectPath, '.gitignore');
      files = this.parseGitignore(gitIgnoreFile, files);
      console.log('Files included in the build context:', files);
  
      const stream = await this.docker.buildImage(
        {
          context: tarPath,
          src: [...files],
        },
        { t: imageName },
      );
  
      await this.handleDockerStream(stream);
      console.log(`Docker image '${imageName}' created successfully.`);
  
      await this.startContainer(imageName);
    } catch (error) {
      // Check for Docker errors
      if (error instanceof Docker.DockerError) {
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

  private async handleDockerStream(stream: NodeJS.ReadableStream): Promise<void> {
    return new Promise((resolve, reject) => {
      stream.on('data', (chunk) => {
        process.stdout.write(chunk.toString());
        console.log(chunk.toString());
      });
      stream.on('end', resolve);
      stream.on('error', reject);
    });
  }

  private async startContainer(imageName: string): Promise<void> {
    try {
      console.log(`Starting container from image: ${imageName}`);
      const container = await this.docker.createContainer({
        Image: imageName,
        name: `${imageName}-container`,
        Tty: true,
        ExposedPorts: {
          '4200/tcp': {},
        },
        HostConfig: {
          PortBindings: {
            '4200/tcp': [{ HostPort: '4200' }],
          },
        },
      });

      await container.start();
      console.log(`Container '${imageName}-container' started successfully.`);
    } catch (error) {
      if (error instanceof Docker.DockerError) {
        throw new HttpException(
          `Docker error: ${error.message}`,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      } else {
        throw new HttpException(
          `Failed to start container: ${error.message}`,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }
  }

  private getRootFileNames(dir: string): string[] {
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      return entries.map((entry) => entry.name);
    } catch (error) {
      throw new HttpException(
        `Error reading directory: ${error.message}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  parseGitignore(gitignorePath, files) {
    try {
      const gitignoreContent = fs.readFileSync(gitignorePath, 'utf-8');
      const ig = ignore().add(gitignoreContent);
      return files.filter(file => !ig.ignores(file));
    } catch (error) {
      throw new HttpException(
        `Error reading .gitignore file: ${error.message}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
