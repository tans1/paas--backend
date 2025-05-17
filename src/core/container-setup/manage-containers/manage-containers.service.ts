import { Injectable } from "@nestjs/common";
import { spawn } from "child_process";

@Injectable()
export class ManageContainerService {
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

  async up(projectPath: string, dockerComposeFile: string): Promise<void> {
    await this.execDockerCommand(["compose","-f", dockerComposeFile, "up", "-d"], projectPath);
  }


  async stop(projectPath: string, dockerComposeFile: string): Promise<void> {
    await this.execDockerCommand(["compose","-f", dockerComposeFile, "stop"], projectPath);
  }

//   async rm(projectPath: string, force = true): Promise<void> {
//     const args = ["compose", "rm", force ? "-f" : ""].filter(Boolean) as string[];
//     await this.execDockerCommand(args, projectPath);
//   }

  async down(projectPath: string, dockerComposeFile: string,removeVolumes = false): Promise<void> {
    const args = ["compose","-f", dockerComposeFile, "down", "--remove-orphans", removeVolumes ? "--volumes" : ""].filter(
      Boolean
    ) as string[];
    await this.execDockerCommand(args, projectPath);
    await this.execDockerCommand(["volume", "prune", "-f"], projectPath);
    await this.execDockerCommand(["network", "prune", "-f"], projectPath);
  }

  async rm(
    containerName: string,
    projectPath: string,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const remove = spawn('docker', ['rm', '-f', containerName], {
        //docker rm -f
        cwd: projectPath,
        stdio: 'inherit',
        env: process.env,
      });

      remove.on('error', (err) => {
        reject(new Error(`Failed to remove container: ${err.message}`));
      });

      remove.on('exit', (rmCode) => {
        if (rmCode === 0) {
          resolve();
        } else {
          reject(new Error(`docker compose rm failed with code ${rmCode}`));
        }
      });
    });
  }
}
