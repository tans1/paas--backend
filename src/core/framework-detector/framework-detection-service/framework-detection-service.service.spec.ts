import { Test, TestingModule } from '@nestjs/testing';
import { FrameworkDetectionService } from './framework-detection.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as fs from 'fs';
import { HttpException, HttpStatus } from '@nestjs/common';
import { EventNames } from 'src/core/events/event.module';
import { frameworkMap } from '../framework.config';

jest.mock('fs', () => ({
  promises: {
    readdir: jest.fn(),
  },
}));

describe('FrameworkDetectionService', () => {
  let service: FrameworkDetectionService;
  let eventEmitter: EventEmitter2;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FrameworkDetectionService,
        EventEmitter2,
      ],
    }).compile();

    service = module.get<FrameworkDetectionService>(FrameworkDetectionService);
    eventEmitter = module.get<EventEmitter2>(EventEmitter2);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('detectFramework', () => {
    const projectPath = '/test/project';

    it('should detect the correct framework and emit event', async () => {
      const configFile = 'angular.json';
      const framework = 'Angular';
      (fs.promises.readdir as jest.Mock).mockResolvedValue([configFile]);
      jest.spyOn(eventEmitter, 'emit');

      const result = await service.detectFramework({ projectPath });

      expect(result).toBe(framework);
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        `EventNames.FRAMEWORK_DETECTED.${framework}`,
        { projectPath, framework, configFile },
      );
    });

    it('should return "Unknown" if no known configuration files are found', async () => {
      (fs.promises.readdir as jest.Mock).mockResolvedValue([]);

      const result = await service.detectFramework({ projectPath });

      expect(result).toBe('Unknown');
    });

    it('should throw HttpException if an error occurs during reading directory', async () => {
      const errorMessage = 'Test error';
      (fs.promises.readdir as jest.Mock).mockRejectedValue(new Error(errorMessage));

      await expect(service.detectFramework({ projectPath })).rejects.toThrow(
        new HttpException(
          `Error during framework detection: ${errorMessage}`,
          HttpStatus.INTERNAL_SERVER_ERROR,
        ),
      );
    });
  });
});