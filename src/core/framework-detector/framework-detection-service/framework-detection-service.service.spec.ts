import { Test, TestingModule } from '@nestjs/testing';
import { FrameworkDetectionService } from './framework-detection.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as fs from 'fs';
import * as path from 'path';
import { FrameworkMap } from '../framework.config';

// Mock dependencies
jest.mock('fs');
jest.mock('path');
jest.mock('../framework.config');

describe('FrameworkDetectionService', () => {
  let service: FrameworkDetectionService;
  let eventEmitter: jest.Mocked<EventEmitter2>;

  const mockPayload = {
    projectPath: '/path/to/project',
  };

  const mockFrameworkMap = {
    react: {
      file: 'package.json',
      dependencies: ['react', 'react-dom'],
    },
    angular: {
      file: 'package.json',
      dependencies: ['@angular/core'],
    },
  };

  const EventNames = {
    PROJECT_UPLOADED: 'project.uploaded',
    FRAMEWORK_DETECTED: 'framework.detected',
  };

  beforeEach(async () => {
    // Mock FrameworkMap
    (FrameworkMap as any) = mockFrameworkMap;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FrameworkDetectionService,
        {
          provide: EventEmitter2,
          useValue: { emit: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<FrameworkDetectionService>(FrameworkDetectionService);
    eventEmitter = module.get(EventEmitter2) as jest.Mocked<EventEmitter2>;

    // Mock path.join
    (path.join as jest.Mock).mockImplementation((...args) => args.join('/'));

    jest.clearAllMocks();
  });

  describe('detectFramework', () => {
    it('should detect framework and emit FRAMEWORK_DETECTED event for valid package.json', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockReturnValue(
        JSON.stringify({ dependencies: { react: '17.0.2' } }),
      );

      await service.detectFramework(mockPayload);

      expect(fs.existsSync).toHaveBeenCalledWith('/path/to/project/package.json');
      expect(fs.readFileSync).toHaveBeenCalledWith('/path/to/project/package.json', 'utf-8');
      expect(eventEmitter.emit).toHaveBeenCalledWith(`${EventNames.FRAMEWORK_DETECTED}.react`, {
        projectPath: '/path/to/project',
        framework: 'react',
        configFile: 'package.json',
      });
    });

    it('should not emit event if no framework is detected', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      await service.detectFramework(mockPayload);

      expect(fs.existsSync).toHaveBeenCalledWith('/path/to/project/package.json');
      expect(fs.readFileSync).not.toHaveBeenCalled();
      expect(eventEmitter.emit).not.toHaveBeenCalled();
    });

    it('should handle invalid JSON and log error', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockReturnValue('invalid json');

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      await service.detectFramework(mockPayload);

      expect(fs.existsSync).toHaveBeenCalledWith('/path/to/project/package.json');
      expect(fs.readFileSync).toHaveBeenCalledWith('/path/to/project/package.json', 'utf-8');
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error parsing JSON'),
        expect.any(Error),
      );
      expect(eventEmitter.emit).not.toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });

    it('should not emit event if dependencies do not match', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockReturnValue(
        JSON.stringify({ dependencies: { express: '4.17.1' } }),
      );

      await service.detectFramework(mockPayload);

      expect(fs.existsSync).toHaveBeenCalledWith('/path/to/project/package.json');
      expect(fs.readFileSync).toHaveBeenCalledWith('/path/to/project/package.json', 'utf-8');
      expect(eventEmitter.emit).not.toHaveBeenCalled();
    });
  });
});