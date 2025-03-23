import { Test, TestingModule } from '@nestjs/testing';
import { NodeProjectScannerService } from './node-project-scanner.service';
import * as fs from 'fs';
import * as path from 'path';
import { FrameworkMap } from '../frameworks.constants';

jest.mock('fs', () => ({
  promises: {
    readFile: jest.fn(),
  },
}));

describe('NodeProjectScannerService', () => {
  let service: NodeProjectScannerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [NodeProjectScannerService],
    }).compile();

    service = module.get<NodeProjectScannerService>(NodeProjectScannerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('scan', () => {
    const payload = {
      projectPath: '/path/to/project',
      configFile: 'package.json',
    };

    it('should scan the project and detect the correct framework', async () => {
      const packageJsonContent = JSON.stringify({
        engines: { node: '14.17.0' },
        dependencies: {
          'express': '^4.17.1',
          'react': '^17.0.2',
        },
        devDependencies: {},
      });
      const expectedResult = {
        projectPath: '/path/to/project',
        nodeVersion: '14.17.0',
        framework: 'React',
        startCommand: 'react-scripts start',
        buildCommand: 'react-scripts build',
        defaultBuildLocation: 'build',
      };

      (fs.promises.readFile as jest.Mock).mockResolvedValue(packageJsonContent);

      const result = await service.scan(payload);

      expect(result).toEqual(expectedResult);
      expect(fs.promises.readFile).toHaveBeenCalledWith(path.join(payload.projectPath, payload.configFile), 'utf-8');
    });

    it('should return default framework if no known dependencies are found', async () => {
      const packageJsonContent = JSON.stringify({
        engines: { node: '14.17.0' },
        dependencies: {},
        devDependencies: {},
      });
      const expectedResult = {
        projectPath: '/path/to/project',
        nodeVersion: '14.17.0',
        framework: 'default',
        startCommand: 'node server.js',
        buildCommand: 'npm run build',
        defaultBuildLocation: 'dist',
      };

      (fs.promises.readFile as jest.Mock).mockResolvedValue(packageJsonContent);

      const result = await service.scan(payload);

      expect(result).toEqual(expectedResult);
      expect(fs.promises.readFile).toHaveBeenCalledWith(path.join(payload.projectPath, payload.configFile), 'utf-8');
    });

    it('should throw an error if reading the file fails', async () => {
      const errorMessage = 'File not found';
      (fs.promises.readFile as jest.Mock).mockRejectedValue(new Error(errorMessage));

      await expect(service.scan(payload)).rejects.toThrow(
        'Failed to scan the Node project. Please ensure the project path and config file are correct.'
      );
    });
  });
});