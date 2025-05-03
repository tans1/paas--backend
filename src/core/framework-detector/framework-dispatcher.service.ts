// src/framework-detection/framework-detection.service.ts
import { Injectable } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { EventNames } from '../events/event.module';
import { FrameworkMap } from './framework.config';
import { AlsService } from '@/utils/als/als.service';


@Injectable()
export class FrameworkDispatcherService  {
  constructor(
    private readonly eventEmitter: EventEmitter2,
    private alsService : AlsService
  ) {}

  @OnEvent(EventNames.PROJECT_UPLOADED)
  async handleEvent(payload: {
   projectPath: string

  }) {
    const { projectPath} = payload
    const framework = this.alsService.getframework()
    const configFile = FrameworkMap[framework].file
    this.eventEmitter.emit(`${EventNames.FRAMEWORK_DETECTED}.${framework}`, {
        projectPath,
        framework,
        configFile,
      });
    
  }

}