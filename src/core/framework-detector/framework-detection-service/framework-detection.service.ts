import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as fs from 'fs';
import * as path from 'path';
import { EventNames } from 'src/core/events/event.module';
import { frameworkMap } from '../framework.config';
import { HttpException, HttpStatus } from '@nestjs/common';

@Injectable()
export class FrameworkDetectionService {
  constructor(private readonly eventEmitter: EventEmitter2) {}

  @OnEvent(EventNames.PROJECT_UPLOADED)
  async detectFramework(payload: { projectPath: string }) {
    const { projectPath } = payload;

    try {
      const files = await fs.promises.readdir(projectPath);

      for (const [configFile, framework] of Object.entries(frameworkMap)) {
        if (files.includes(configFile)) {
          console.log(`Framework detected: ${framework}`);
          this.eventEmitter.emit(`EventNames.FRAMEWORK_DETECTED.${framework}`, {
            projectPath,
            framework,
            configFile,
          });

          return framework;
        }
      }

      console.warn(
        'Framework detection failed. No known configuration files found.',
      );

      return 'Unknown';
    } catch (error) {
      
      throw new HttpException(
        `Error during framework detection: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
