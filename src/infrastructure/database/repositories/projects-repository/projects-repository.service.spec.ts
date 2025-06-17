import { ProjectsRepositoryService } from './projects-repository.service';
import { PrismaService } from '../../prisma/prisma-service/prisma-service.service';
import { Project, DeploymentLog, NotificationPreferences } from '@prisma/client';
import {
  CreateProjectDTO,
  UpdateProjectDTO,
  CreateCustomDomain,
  UpdateCustomDomain,
} from './../../interfaces/projects-repository-interface/projects-repository-interface.interface';

describe('ProjectsRepositoryService', () => {
  let service: ProjectsRepositoryService;
  let prismaMock: any;

  beforeEach(() => {
    prismaMock = {
      project: {
        findMany: jest.fn(),
        upsert: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      customDomain: {
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        findFirst: jest.fn(),
      },
    };
    service = new ProjectsRepositoryService(prismaMock as PrismaService);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('findByUserId', () => {
    it('calls prisma.project.findMany with correct where and include', async () => {
      const projects: Project[] = [{ id: 1, repoId: 1, branch: 'b', linkedByUserId: 5 } as any];
      prismaMock.project.findMany.mockResolvedValue(projects);

      const result = await service.findByUserId(5);

      expect(prismaMock.project.findMany).toHaveBeenCalledWith({
        where: { linkedByUserId: 5 },
        include: {
          deployments: { include: { logs: true } },
        },
      });
      expect(result).toBe(projects);
    });
  });

  describe('create', () => {
    it('calls upsert with correct create and update payloads', async () => {
      const dto: CreateProjectDTO = {
        repoId: 2,
        branch: 'main',
        linkedByUserId: 5,
        environmentVariables: { A: 'B' },
        installCommand: 'i',
        buildCommand: 'b',
        outputDirectory: 'out',
        rootDirectory: 'root',
        name: 'my-project',
        url: '',
        framework: 'nestjs',
        lastCommitMessage: 'fix test'
      };
      const created: Project = { ...dto, id: 10 } as any;
      prismaMock.project.upsert.mockResolvedValue(created);

      const result = await service.create(dto);

      expect(prismaMock.project.upsert).toHaveBeenCalledWith({
        where: { repoId_branch: { repoId: 2, branch: 'main' } },
        update: {
          environmentVariables: dto.environmentVariables,
          installCommand: dto.installCommand,
          buildCommand: dto.buildCommand,
          outputDirectory: dto.outputDirectory,
          rootDirectory: dto.rootDirectory,
        },
        create: dto,
      });
      expect(result).toBe(created);
    });
  });

  describe('findByRepoAndBranch', () => {
    it('returns project with customDomains when found', async () => {
      const proj = { id: 3, repoId: 2, branch: 'b' } as any;
      const domains = [{ id: 7, projectId: 3, domain: 'd', live: true }] as any;
      prismaMock.project.findUnique.mockResolvedValue(proj);
      prismaMock.customDomain.findMany.mockResolvedValue(domains);

      const result = await service.findByRepoAndBranch(2, 'b');

      expect(prismaMock.project.findUnique).toHaveBeenCalledWith({
        where: { repoId_branch: { repoId: 2, branch: 'b' } },
        include: { deployments: { include: { logs: true } }, linkedByUser: true },
      });
      expect(prismaMock.customDomain.findMany).toHaveBeenCalledWith({
        where: { projectId: 3, live: true },
      });
      expect((result as any).customDomains).toBe(domains);
    });

    it('returns null when project not found', async () => {
      prismaMock.project.findUnique.mockResolvedValue(null);

      const result = await service.findByRepoAndBranch(9, 'x');

      expect(result).toBeNull();
      expect(prismaMock.customDomain.findMany).not.toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    it('returns project with customDomains when found', async () => {
      const proj = { id: 4 } as any;
      const domains = [{ id: 8, projectId: 4, domain: 'e', live: true }] as any;
      prismaMock.project.findUnique.mockResolvedValue(proj);
      prismaMock.customDomain.findMany.mockResolvedValue(domains);

      const result = await service.findById(4);

      expect(prismaMock.project.findUnique).toHaveBeenCalledWith({
        where: { id: 4 },
        include: { deployments: { include: { logs: true } }, linkedByUser: true },
      });
      expect(prismaMock.customDomain.findMany).toHaveBeenCalledWith({
        where: { projectId: 4, live: true },
      });
      expect((result as any).customDomains).toBe(domains);
    });

    it('returns null when not found', async () => {
      prismaMock.project.findUnique.mockResolvedValue(null);

      const result = await service.findById(5);

      expect(result).toBeNull();
      expect(prismaMock.customDomain.findMany).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('calls prisma.project.update', async () => {
      const dto: UpdateProjectDTO = { name: 'n' } as any;
      const updated: Project = { id: 6 } as any;
      prismaMock.project.update.mockResolvedValue(updated);

      const result = await service.update(6, dto);

      expect(prismaMock.project.update).toHaveBeenCalledWith({
        where: { id: 6 },
        data: dto,
      });
      expect(result).toBe(updated);
    });
  });

  describe('delete', () => {
    it('calls prisma.project.delete', async () => {
      prismaMock.project.delete.mockResolvedValue(undefined);

      await expect(service.delete(7)).resolves.toBeUndefined();
      expect(prismaMock.project.delete).toHaveBeenCalledWith({
        where: { id: 7 },
      });
    });
  });

  describe('getAllDeployments', () => {
    it('calls findUnique with deployments include', async () => {
      const project = { id: 9, deployments: [] } as any;
      prismaMock.project.findUnique.mockResolvedValue(project);

      const result = await service.getAllDeployments(9);

      expect(prismaMock.project.findUnique).toHaveBeenCalledWith({
        where: { id: 9 },
        include: { deployments: true },
      });
      expect(result).toBe(project);
    });
  });

  describe('getAllProjects', () => {
    it('calls findMany with include', async () => {
      const projs = [] as any;
      prismaMock.project.findMany.mockResolvedValue(projs);

      const result = await service.getAllProjects();

      expect(prismaMock.project.findMany).toHaveBeenCalledWith({
        include: { deployments: true, linkedByUser: true },
      });
      expect(result).toBe(projs);
    });
  });

  describe('createCustomDomain', () => {
    it('calls customDomain.create', async () => {
      const dto: CreateCustomDomain = { projectId: 10, domain: 'd.com' };
      prismaMock.customDomain.create.mockResolvedValue(undefined);

      await expect(service.createCustomDomain(dto)).resolves.toBeUndefined();
      expect(prismaMock.customDomain.create).toHaveBeenCalledWith({
        data: { projectId: 10, domain: 'd.com' },
      });
    });
  });

  describe('updateCustomDomain', () => {
    it('calls customDomain.update', async () => {
      const dto: UpdateCustomDomain = { live: false };
      prismaMock.customDomain.update.mockResolvedValue(undefined);

      await expect(service.updateCustomDomain(11, dto)).resolves.toBeUndefined();
      expect(prismaMock.customDomain.update).toHaveBeenCalledWith({
        where: { id: 11 },
        data: { live: false },
      });
    });
  });

  describe('findCustomDomainByDomainAndProjectId', () => {
    it('calls customDomain.findFirst and returns result', async () => {
      const dom = { id: 12, domain: 'x', projectId: 13, live: true } as any;
      prismaMock.customDomain.findFirst.mockResolvedValue(dom);

      const result = await service.findCustomDomainByDomainAndProjectId('x', 13);

      expect(prismaMock.customDomain.findFirst).toHaveBeenCalledWith({
        where: { domain: 'x', projectId: 13 },
      });
      expect(result).toBe(dom);
    });
  });

  describe('unimplemented methods', () => {
    it('list throws not implemented', () => {
      expect(() => service.list()).toThrow('Method not implemented.');
    });
    it('addDeployment throws not implemented', () => {
      expect(() => service.addDeployment(1, 2)).toThrow('Method not implemented.');
    });
  });
});
