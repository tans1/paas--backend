import { Injectable, Logger } from "@nestjs/common";
import { Deployment } from "@prisma/client";
import { spawn } from "child_process";
import { DockerHubService } from "../create-image/docker-hub.service";
import { RuntimeLogService } from "../create-image/containter-runtime-log.service";
import { DockerComposeService } from "../docker-compose/dockerCompose.service";

@Injectable()
export class ManageContainerService {

  readonly logger = new Logger(ManageContainerService.name)
  constructor(
    private dockerHubService: DockerHubService,
    private runtimeLogService: RuntimeLogService,
    private dockerComposeService: DockerComposeService
  ){

  }
  private execDockerCommand(
    args: string[],
    projectPath: string,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const proc = spawn("docker", args, {
        cwd: projectPath,
        stdio: "inherit",
        env: process.env,
      });

      proc.on("error", (err) => {
        reject(new Error(`Failed to execute docker command: ${err.message}`));
      });

      proc.on("exit", (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(
            new Error(
              `docker command "${args.join(" ")}" exited with code ${code}`
            )
          );
        }
      });
    });
  }

  // async up(projectPath: string, dockerComposeFile: string): Promise<void> {
  //   await this.execDockerCommand(["compose","-f", dockerComposeFile, "up", "-d"], projectPath);
  // }
  async start(projectPath: string, repoId : number, activeDeployment: Deployment): Promise<void> {
    const { containerName, imageName,branch,id } = activeDeployment;
    
    // Force remove any existing container first
    await this.rm(containerName, projectPath);
    
    await this.execDockerCommand(
      ["run", "-d", "--name", containerName, imageName],
      projectPath
    );

    await this.runtimeLogService.streamContainerLogs(
      containerName,
      repoId,
      branch,
      id
    )
  }


  async stop(projectPath: string, activeDeployment : Deployment): Promise<void> {
    const containerName = activeDeployment.containerName
    const imageName = activeDeployment.imageName
    await this.execDockerCommand(["stop", containerName], projectPath);
  }

//   async rm(projectPath: string, force = true): Promise<void> {
//     const args = ["compose", "rm", force ? "-f" : ""].filter(Boolean) as string[];
//     await this.execDockerCommand(args, projectPath);
//   }

  // async down(projectPath: string, dockerComposeFile: string,removeVolumes = false): Promise<void> {
  //   const args = ["compose","-f", dockerComposeFile, "down", "--remove-orphans", removeVolumes ? "--volumes" : ""].filter(
  //     Boolean
  //   ) as string[];
  //   await this.execDockerCommand(args, projectPath);
  // }

  // shoudl I move this to compose service it doesnt't have to 
  // I can keep it here but i would bring in the composeServie
  // 
  async rollback(
    projectPath : string, 
    projectName : string,
    repoId : number,
    dockerComposeFile: string,
    rollbackDeployment: Deployment
  ) {
    const { 
      imageName, 
      containerName, 
      branch, 
      id ,
      extension
    } = rollbackDeployment;
  
    try {
      // Pull the rollback image using DockerHubService
      await this.dockerHubService.pullImage(
        imageName,
        repoId,
        branch,
        id
      );

      await this.dockerComposeService.up(
        projectPath,
        dockerComposeFile,
        extension,
        projectName
      )
  
      // Stream logs through the logging service
      await this.runtimeLogService.streamContainerLogs(
        containerName,
        repoId,
        branch,
        id
      );
  
    } catch (error) {
      this.logger.error(`Rollback failed: ${error.message}`);
      throw new Error(`[ROLLBACK_FAILED] ${error.message}`);
    }
  }

  async cleanup(projectPath: string) {
    // Target only project-specific resources
    await this.execDockerCommand(
      ["network", "prune", "-f", "--filter", "name=project_network"],
      projectPath
    );
    // Add similar filtered cleanup for volumes if needed
  }

  async rm(containerName: string, projectPath: string): Promise<void> {
    try {
      await this.execDockerCommand(["rm", "-f", containerName], projectPath);
    } catch (error) {
      throw new Error(`Failed to remove container ${containerName}: ${error.message}`);
    }
  }
}
