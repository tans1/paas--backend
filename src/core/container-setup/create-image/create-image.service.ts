import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { EventNames } from 'src/core/events/event.module';
import * as Docker from 'dockerode';
import * as path from 'path';
import * as fs from 'fs';
import ignore from 'ignore';
import { v4 as uuidv4 } from 'uuid';
import {ImageBuildGateway} from '../Image-build-gateway';
import { AlsService } from '@/utils/als/als.service';

@Injectable()
export class CreateImageService {
  private docker: Docker;

  constructor(private imageBuildGateway : ImageBuildGateway,private readonly alsService: AlsService) {
    this.docker = new Docker(); 
  }


  @OnEvent(EventNames.SourceCodeReady)
  async createImage(payload: { projectPath: string; imageName: string }) {
    const { projectPath } = payload;
    const imageName = `imagename-${uuidv4()}`.toLowerCase();
    console.log('Creating Docker image...');
    
    // TODO: we should track the image for each project and delete old ones before creating new ones.
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
    } 
      catch (error) {
        console.error('Docker error:', error);
      
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

  private async handleDockerStream(stream: NodeJS.ReadableStream): Promise<void> {
    const repositoryId = this.alsService.getrepositoryId();
    return new Promise((resolve, reject) => {
      stream.on('data', (chunk) => {
        process.stdout.write(chunk.toString());
        console.log(chunk.toString());
        let logMessage = chunk.toString();
        this.imageBuildGateway.sendLogToUser(repositoryId, logMessage);
      });
      stream.on('end', resolve);
      stream.on('error', reject);
    });
  }

  private async startContainer(imageName: string): Promise<void> {
    try {
      const container = await this.docker.createContainer({
        Image: imageName,
        name: `${imageName}-container`,
        Tty: true,
        ExposedPorts: { '4200/tcp': {} },
        HostConfig: {
          PortBindings: { '4200/tcp': [{}] },
        },
      });
      
      await container.start();
      
      let containerInfo;
      const maxRetries = 5;
      const delayMs = 1000;
      for (let i = 0; i < maxRetries; i++) {
        containerInfo = await container.inspect();
        const portBindings = containerInfo?.NetworkSettings?.Ports?.['4200/tcp'];
        if (portBindings && portBindings[0] && portBindings[0].HostPort) {
          break; 
        }
        console.log(`Waiting for port mapping to be assigned... (${i + 1}/${maxRetries})`);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
      
      const portBindings = containerInfo.NetworkSettings.Ports['4200/tcp'];
      if (!portBindings || !portBindings[0] || !portBindings[0].HostPort) {
        throw new Error("Failed to obtain HostPort mapping from container");
      }
      
      const assignedPort = portBindings[0].HostPort;
      console.log(`Container started on port: ${assignedPort}`);

      const repositoryId = this.alsService.getrepositoryId();
      if (repositoryId){

        this.imageBuildGateway.sendLogToUser(repositoryId, `Container started on port: ${assignedPort}`);
      }
      
    } catch (error) {
      console.error('Docker error:', error);
    
      if (error.statusCode) { 
        throw new HttpException(
          `Docker error: ${error.message}`,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    
      throw new HttpException(
        `Failed to start container: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
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
