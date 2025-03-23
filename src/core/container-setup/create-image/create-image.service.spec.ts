import { Test, TestingModule } from '@nestjs/testing';
import { CreateImageService } from './create-image.service';
import * as Docker from 'dockerode';
import * as fs from 'fs';
import { ImageBuildGateway } from '../image-build-gateway';
import { AlsService } from '@/utils/als/als.service';
import { HttpException, HttpStatus } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as path from 'path';
import ignore from 'ignore';

jest.mock('fs', () => ({
  promises: {
    readFile: jest.fn(),
  },
  readdirSync: jest.fn(),
  readFileSync: jest.fn(),
}));

jest.mock('dockerode');

describe('CreateImageService', () => {
  let service: CreateImageService;
  let docker: Docker;
  let imageBuildGateway: ImageBuildGateway;
  let alsService: AlsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateImageService,
        {
          provide: ImageBuildGateway,
          useValue: {
            sendLogToUser: jest.fn(),
          },
        },
        {
          provide: AlsService,
          useValue: {
            getrepositoryId: jest.fn(),
          },
        },
        EventEmitter2,
      ],
    }).compile();

    service = module.get<CreateImageService>(CreateImageService);
    imageBuildGateway = module.get<ImageBuildGateway>(ImageBuildGateway);
    alsService = module.get<AlsService>(AlsService);
    docker = new Docker();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createImage', () => {
    const payload = {
      projectPath: '/path/to/project',
      imageName: 'test-image',
    };

    it('should create a Docker image and start a container', async () => {
      const tarPath = path.resolve(payload.projectPath);
      const files = ['file1.js', 'file2.js'];
      const imageName = `imagename-${uuidv4()}`.toLowerCase();
      
      jest.spyOn(service, 'getRootFileNames').mockReturnValue(files);
      jest.spyOn(service, 'parseGitignore').mockReturnValue(files);
      jest.spyOn(service, 'handleDockerStream').mockResolvedValue();
      jest.spyOn(service, 'startContainer').mockResolvedValue();

      const stream = { on: jest.fn().mockImplementation((event, callback) => {
          if (event === 'end') callback();
        }),
      };
      jest.spyOn(docker, 'buildImage').mockImplementation((_, __, callback) => callback(null, stream));

      await service.createImage(payload);

      expect(service.getRootFileNames).toHaveBeenCalledWith(tarPath);
      expect(service.parseGitignore).toHaveBeenCalledWith(path.join(payload.projectPath, '.gitignore'), files);
      expect(docker.buildImage).toHaveBeenCalledWith(
        { context: tarPath, src: [...files] },
        { t: imageName },
        expect.any(Function),
      );
      expect(service.handleDockerStream).toHaveBeenCalledWith(stream);
      expect(service.startContainer).toHaveBeenCalledWith(imageName);
    });

    it('should throw HttpException for Docker errors', async () => {
      jest.spyOn(docker, 'buildImage').mockImplementation((_, __, callback) => callback(new Error('Docker error')));

      await expect(service.createImage(payload)).rejects.toThrow(
        new HttpException('Docker error: Docker error', HttpStatus.INTERNAL_SERVER_ERROR),
      );
    });

    it('should throw HttpException for file not found errors', async () => {
      jest.spyOn(service, 'getRootFileNames').mockImplementation(() => {
        throw { code: 'ENOENT', message: 'File not found' };
      });

      await expect(service.createImage(payload)).rejects.toThrow(
        new HttpException('File not found: File not found', HttpStatus.BAD_REQUEST),
      );
    });

    it('should throw HttpException for unexpected errors', async () => {
      jest.spyOn(service, 'getRootFileNames').mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      await expect(service.createImage(payload)).rejects.toThrow(
        new HttpException('Unexpected error: Unexpected error', HttpStatus.INTERNAL_SERVER_ERROR),
      );
    });
  });

  describe('handleDockerStream', () => {
    it('should handle Docker stream and send logs to user', async () => {
      const repositoryId = 'test-repo-id';
      const stream = { on: jest.fn().mockImplementation((event, callback) => {
          if (event === 'data') callback(Buffer.from('log message'));
          if (event === 'end') callback();
        }),
      };
      alsService.getrepositoryId = jest.fn().mockReturnValue(repositoryId);

      await service.handleDockerStream(stream as unknown as NodeJS.ReadableStream);

      expect(stream.on).toHaveBeenCalledWith('data', expect.any(Function));
      expect(stream.on).toHaveBeenCalledWith('end', expect.any(Function));
      expect(imageBuildGateway.sendLogToUser).toHaveBeenCalledWith(repositoryId, 'log message');
    });
  });

  describe('startContainer', () => {
    const imageName = 'test-image';

    it('should start a Docker container', async () => {
      const container = {
        start: jest.fn(),
        inspect: jest.fn().mockResolvedValue({
          NetworkSettings: {
            Ports: {
              '4200/tcp': [{ HostPort: '8080' }],
            },
          },
        }),
      };
      docker.createContainer = jest.fn().mockResolvedValue(container);

      await service.startContainer(imageName);

      expect(docker.createContainer).toHaveBeenCalledWith({
        Image: imageName,
        name: `${imageName}-container`,
        Tty: true,
        ExposedPorts: { '4200/tcp': {} },
        HostConfig: { PortBindings: { '4200/tcp': [{}] } },
      });
      expect(container.start).toHaveBeenCalled();
      expect(container.inspect).toHaveBeenCalled();
    });

    it('should throw HttpException if container start fails', async () => {
      const errorMessage = 'Failed to start container';
      docker.createContainer = jest.fn().mockRejectedValue(new Error(errorMessage));

      await expect(service.startContainer(imageName)).rejects.toThrow(
        new HttpException(`Failed to start container: ${errorMessage}`, HttpStatus.INTERNAL_SERVER_ERROR),
      );
    });
  });

  describe('getRootFileNames', () => {
    const dir = '/path/to/project';

    it('should return file names in the directory', () => {
      const files = ['file1.js', 'file2.js'];
      jest.spyOn(fs, 'readdirSync').mockReturnValue(files.map(file => ({ name: file })));

      const result = service.getRootFileNames(dir);

      expect(result).toEqual(files);
      expect(fs.readdirSync).toHaveBeenCalledWith(dir, { withFileTypes: true });
    });

    it('should throw HttpException if reading directory fails', () => {
      const errorMessage = 'Error reading directory';
      jest.spyOn(fs, 'readdirSync').mockImplementation(() => {
        throw new Error(errorMessage);
      });

      expect(() => service.getRootFileNames(dir)).toThrow(
        new HttpException(`Error reading directory: ${errorMessage}`, HttpStatus.BAD_REQUEST),
      );
    });
  });

  describe('parseGitignore', () => {
    const gitignorePath = '/path/to/.gitignore';
    const files = ['file1.js', 'file2.js'];

    it('should filter files based on .gitignore', () => {
      const gitignoreContent = 'node_modules\n';
      jest.spyOn(fs, 'readFileSync').mockReturnValue(gitignoreContent);
      const ig = ignore().add(gitignoreContent);

      const result = service.parseGitignore(gitignorePath, files);

      expect(result).toEqual(files.filter(file => !ig.ignores(file)));
      expect(fs.readFileSync).toHaveBeenCalledWith(gitignorePath, 'utf-8');
    });

    it('should throw HttpException if reading .gitignore file fails', () => {
      const errorMessage = 'Error reading .gitignore file';
      jest.spyOn(fs, 'readFileSync').mockImplementation(() => {
        throw new Error(errorMessage);
      });

      expect(() => service.parseGitignore(gitignorePath, files)).toThrow(
        new HttpException(`Error reading .gitignore file: ${errorMessage}`, HttpStatus.BAD_REQUEST),
      );
    });
  });
});