import { DeploymentRepositoryService } from './deployment-repository.service';
import { PrismaService } from '../../prisma/prisma-service/prisma-service.service';
import {
  CreateDeploymentDTO,
  CreateDeploymentLogDTO,
  UpdateDeploymentDTO,
} from '../../interfaces/deployment-repository-interface/deployment-repository-interface.interface';
import { Deployment, DeploymentLog } from '@prisma/client';

describe('DeploymentRepositoryService', () => {
  let service: DeploymentRepositoryService;
  let prismaMock: Partial<PrismaService>;

  beforeEach(() => {
    prismaMock = {
      deployment: {
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      } as any,
      deploymentLog: {
        create: jest.fn(),
      } as any,
    };
    service = new DeploymentRepositoryService(prismaMock as PrismaService);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('create', () => {
    const basePayload: CreateDeploymentDTO = {
      projectId: 1,
      status: 'in-progress',
      branch: 'main',
      environmentVariables: { A: 'B' },
      lastCommitMessage: 'msg',
      extension: '.ext',
    };

    it('calls prisma.deployment.create without rollback when rollbackToId is absent', async () => {
      const created: Deployment = { id: 10, ...basePayload, createdAt: new Date(), imageName: null, containerName: null } as any;
      (prismaMock.deployment!.create as jest.Mock).mockResolvedValue(created);

      const result = await service.create(basePayload);

      expect(prismaMock.deployment!.create).toHaveBeenCalledWith({
        data: { ...basePayload },
      });
      expect(result).toBe(created);
    });

    it('includes rollbackTo when rollbackToId is provided', async () => {
      const payload: CreateDeploymentDTO & { rollbackToId: number } = {
        ...basePayload,
        rollbackToId: 99,
      };
      const created: Deployment = { id: 11, ...basePayload, createdAt: new Date(), imageName: null, containerName: null } as any;
      (prismaMock.deployment!.create as jest.Mock).mockResolvedValue(created);

      const result = await service.create(payload);

      expect(prismaMock.deployment!.create).toHaveBeenCalledWith({
        data: {
          ...basePayload,
          rollbackTo: { connect: { id: 99 } },
        },
      });
      expect(result).toBe(created);
    });
  });

  describe('findById', () => {
    it('calls prisma.deployment.findUnique with correct where clause', async () => {
      const dep: Deployment = { id: 5, projectId: 1, status: 'x', branch: 'b', environmentVariables: {}, lastCommitMessage: '', extension: '', createdAt: new Date(), imageName: null, containerName: null } as any;
      (prismaMock.deployment!.findUnique as jest.Mock).mockResolvedValue(dep);

      const result = await service.findById(5);

      expect(prismaMock.deployment!.findUnique).toHaveBeenCalledWith({
        where: { id: 5 },
      });
      expect(result).toBe(dep);
    });
  });

  describe('update', () => {
    it('calls prisma.deployment.update with correct args', async () => {
      const updateDto: UpdateDeploymentDTO = { status: 'deployed' };
      const updated: Deployment = { id: 6, projectId: 1, status: 'deployed', branch: 'b', environmentVariables: {}, lastCommitMessage: '', extension: '', createdAt: new Date(), imageName: null, containerName: null } as any;
      (prismaMock.deployment!.update as jest.Mock).mockResolvedValue(updated);

      const result = await service.update(6, updateDto);

      expect(prismaMock.deployment!.update).toHaveBeenCalledWith({
        where: { id: 6 },
        data: updateDto,
      });
      expect(result).toBe(updated);
    });
  });

  describe('addLog', () => {
    it('calls prisma.deploymentLog.create with timestamp', async () => {
      const logDto: CreateDeploymentLogDTO = {
        deploymentId: 7,
        logLevel: 'info',
        message: 'hello',
        logType: 'BUILD',
      };
      const createdLog: DeploymentLog = {
        id: 100,
        ...logDto,
        timestamp: new Date(),
      } as any;
      (prismaMock.deploymentLog!.create as jest.Mock).mockResolvedValue(createdLog);

      const result = await service.addLog(logDto);

      expect(prismaMock.deploymentLog!.create).toHaveBeenCalledWith({
        data: {
          deploymentId: 7,
          logLevel: 'info',
          message: 'hello',
          timestamp: expect.any(Date),
          logType: 'BUILD',
        },
      });
      expect(result).toBe(createdLog);
    });
  });

  describe('unimplemented methods', () => {
    it('delete throws not implemented', () => {
      expect(() => service.delete(1)).toThrow('Method not implemented.');
    });
    it('list throws not implemented', () => {
      expect(() => service.list()).toThrow('Method not implemented.');
    });
    it('getLogsByDeploymentId throws not implemented', () => {
      expect(() => service.getLogsByDeploymentId(1)).toThrow('Method not implemented.');
    });
  });
});
