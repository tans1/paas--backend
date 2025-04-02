import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as fs from 'fs';
import * as path from 'path';
import { EventNames } from 'src/core/events/event.module';
import { FrameworkMap } from '../framework.config';

@Injectable()
export class FrameworkDetectionService {
  constructor(private readonly eventEmitter: EventEmitter2) {}

  @OnEvent(EventNames.PROJECT_UPLOADED)
  async detectFramework(payload: { projectPath: string }) {
    const { projectPath } = payload;

    for (const [framework, criteria] of Object.entries(FrameworkMap)) {
      const configFile = criteria.file
      const filePath = path.join(projectPath, configFile);
  
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, "utf-8");
  
        if (configFile.endsWith(".json")) {
          try {
            const data = JSON.parse(content);
            if (
              data.dependencies &&
              criteria.dependencies?.some((dep) => dep in data.dependencies)
            ) {
              console.log(`Framework detected: ${framework}`);
              console.log(`${EventNames.FRAMEWORK_DETECTED}.${framework}`)
            this.eventEmitter.emit(`${EventNames.FRAMEWORK_DETECTED}.${framework}`, {
              projectPath,
              framework,
              configFile,
            });

            }
          } catch (error) {
            console.error("Error parsing JSON:", error);
          }
        }

      } 
      }
  }
}
