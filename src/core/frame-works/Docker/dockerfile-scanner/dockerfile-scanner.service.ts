import { Injectable, Logger } from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class DockerfileScannerService {
  private readonly logger = new Logger(DockerfileScannerService.name);

  constructor() {}

  async scan(payload: any): Promise<{ PORT: number }> {
    const { projectPath, configFile = 'Dockerfile' } = payload;
    const dockerFilePath = path.join(projectPath, configFile);

    try {
      const dockerFileContent = await fs.promises.readFile(
        dockerFilePath,
        'utf-8',
      );

      const portMatch = dockerFileContent.match(/EXPOSE\s+(\d+)/);
      if (!portMatch) {
        throw new Error('No PORT found in Dockerfile');
      }

      const PORT = parseInt(portMatch[1], 10);

      this.logger.log(`Successfully detected PORT ${PORT} from Dockerfile`);
      return { PORT };
    } catch (err: any) {
      this.logger.error(`Dockerfile scan failed: ${err.message}`);
      throw new Error(`Failed to process Dockerfile: ${err.message}`);
    }
  }
}
