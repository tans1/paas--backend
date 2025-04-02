import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import * as Docker from 'dockerode';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { exec } from 'child_process';
import { DockerLogService } from './docker-log.service';
import { FileService } from './file.service';
import { promisify } from 'util';
import * as fs from 'fs';
import * as ejs from 'ejs';


const execAsync = promisify(exec);
@Injectable()
export class ImageBuildService {
  // private docker: Docker;

  constructor(
    private readonly dockerLogService: DockerLogService,
    private readonly fileService: FileService,
  ) {
    // this.docker = new Docker();
  }

  async buildImage(projectPath: string, deploymentId: number,projectName : string,deploymentUrl : string): Promise<string> {
    // we don't have a compose file
    const extension = uuidv4();
    const templatePath = path.join(__dirname, 'templates', 'docker-compose.yml.ejs');
    const templateContent = await fs.promises.readFile(templatePath, 'utf-8');
    const extenedProjectName = projectName + extension;
    
    const dockerComposeContent = ejs.render(templateContent, {
           projectName:  projectName + extension,
            deploymentUrl: deploymentUrl,
            envFileName : `${projectName}.env`
            });

    const dockerComposePath = path.join(projectPath, 'docker-compose.yml');
    await fs.promises.writeFile(dockerComposePath, dockerComposeContent, 'utf-8');
    const command = `docker compose up -d --build`;
    const { stdout, stderr } = await execAsync(command, { cwd: projectPath });

    // 3. Log output
    await this.dockerLogService.logMessage(stdout, deploymentId);
    if (stderr) {
      await this.dockerLogService.logMessage(stderr, deploymentId);
    }

    return  extenedProjectName;

  }

 
  

}
