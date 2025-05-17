import { Test, TestingModule } from '@nestjs/testing';
import { ReactDockerIgnoreFileService } from './react-dockerignorefile.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as fs from 'fs';
import * as path from 'path';

jest.mock('fs', () => ({
  promises: {
    readFile: jest.fn(),
    writeFile: jest.fn(),
    access: jest.fn(),
  },
}));

describe('ReactDockerIgnoreFileService', () => {
  let service: ReactDockerIgnoreFileService;
  let eventEmitter: EventEmitter2;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReactDockerIgnoreFileService,
        {
          provide: EventEmitter2,
          useValue: {
            emit: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ReactDockerIgnoreFileService>(ReactDockerIgnoreFileService);
    eventEmitter = module.get<EventEmitter2>(EventEmitter2);

    // Mock the template file content
    (fs.promises.readFile as jest.Mock).mockResolvedValue('node_modules\nnpm-debug.log\nbuild\n.dockerignore\n.git\n.gitignore');
    (fs.promises.access as jest.Mock).mockResolvedValue(undefined);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('addDockerIgnoreFile', () => {
    it('should create .dockerignore file with correct configuration', async () => {
      const mockConfig = {
        projectPath: '/test/project/path',
      };

      await service.addDockerIgnoreFile(mockConfig);
      
      expect(fs.promises.access).toHaveBeenCalledWith(mockConfig.projectPath);
      expect(fs.promises.readFile).toHaveBeenCalled();
      expect(fs.promises.writeFile).toHaveBeenCalledWith(
        path.join(mockConfig.projectPath, '.dockerignore'),
        expect.any(String),
        'utf-8'
      );
    });

    it('should handle errors during .dockerignore creation', async () => {
      const mockConfig = {
        projectPath: '/nonexistent/path',
      };

      const error = new Error('Directory not found');
      (error as any).code = 'ENOENT';
      (fs.promises.access as jest.Mock).mockRejectedValueOnce(error);

      await expect(service.addDockerIgnoreFile(mockConfig)).rejects.toThrow('File or directory not found: Directory not found');
    });

    it('should throw error when project path is not provided', async () => {
      const mockConfig = {};

      await expect(service.addDockerIgnoreFile(mockConfig as any)).rejects.toThrow('Project path is required');
    });
  });
}); 