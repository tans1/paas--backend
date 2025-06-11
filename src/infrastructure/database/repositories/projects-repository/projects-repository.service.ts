import { Injectable } from '@nestjs/common';
import {
  CreateProjectDTO,
  ProjectsRepositoryInterface,
  UpdateProjectDTO,
  ProjectWithDeploymentsAndUser,
  CreateCustomDomain,
  UpdateCustomDomain,
} from './../../interfaces/projects-repository-interface/projects-repository-interface.interface';
import { PrismaService } from '../../prisma/prisma-service/prisma-service.service';
import { Project } from '@prisma/client';

@Injectable()
export class ProjectsRepositoryService
  extends PrismaService
  implements ProjectsRepositoryInterface
{
  constructor(private prisma: PrismaService) {
    super();
  }

  async findByUserId(userId: number): Promise<Project[]> {
    return this.prisma.project.findMany({
      where: {
        linkedByUserId: userId,
      },
      include: {
        deployments: {
          include: {
            logs: true,
          },
        },
      },
    });
  }

  async create(payload: CreateProjectDTO): Promise<Project> {
    // const { linkedByUserId, ...rest } = payload;
    return await this.prisma.project.upsert({
      where: {
        repoId_branch: {
          repoId: payload.repoId,
          branch: payload.branch,
        },
      },
      update: {
        environmentVariables: payload.environmentVariables,
        installCommand: payload.installCommand,
        buildCommand: payload.buildCommand,
        outputDirectory: payload.outputDirectory,
        rootDirectory: payload.rootDirectory,
      },
      create: payload,
    });
  }

  async findByRepoAndBranch(
    repoId: number,
    branch: string,
  ): Promise<ProjectWithDeploymentsAndUser | null> {
    const project = await this.prisma.project.findUnique({
      where: {
        repoId_branch: {
          repoId,
          branch,
        },
      },
      include: {
        deployments: {
          include: {
            logs: true,
          },
        },
        linkedByUser: true,
      },
    });
    if (project) {
      const liveDomains = await this.prisma.customDomain.findMany({
        where: { projectId: project.id, live: true },
      });
      (project as any).customDomains = liveDomains;
    }
    return project;
  }

  async findById(id: number): Promise<ProjectWithDeploymentsAndUser | null> {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: {
        deployments: {
          include: {
            logs: true,
          },
        },
        linkedByUser: true,
      },
    });
    if (project) {
      const liveDomains = await this.prisma.customDomain.findMany({
        where: { projectId: project.id, live: true },
      });
      (project as any).customDomains = liveDomains;
    }
    return project;
  }
  update(id: number, payload: UpdateProjectDTO): Promise<Project> {
    return this.prisma.project.update({ where: { id }, data: payload });
  }

  async delete(id: number): Promise<void> {
    await this.prisma.project.delete({
      where: { id },
    });
  }
  list(filters?: Partial<Project>): Promise<Project[]> {
    throw new Error('Method not implemented.');
  }
  addDeployment(projectId: number, deploymentId: number): Promise<void> {
    throw new Error('Method not implemented.');
  }
  getAllDeployments(projectid: number): Promise<Project> {
    return this.prisma.project.findUnique({
      where: {
        id: projectid,
      },
      include: {
        deployments: true,
      },
    });
  }

  async getAllProjects(): Promise<ProjectWithDeploymentsAndUser[]> {
    return this.prisma.project.findMany({
      include: {
        deployments: true,
        linkedByUser: true,
      },
    });
  }

  async createCustomDomain(payload: CreateCustomDomain): Promise<void> {
    await this.prisma.customDomain.create({
      data: {
        domain: payload.domain,
        projectId: payload.projectId,
      },
    });
  }

  async updateCustomDomain(
    domainId: number,
    payload: UpdateCustomDomain,
  ): Promise<void> {
    await this.prisma.customDomain.update({
      where: { id: domainId },
      data: { live: payload.live },
    });
  }

  async findCustomDomainByDomainAndProjectId(
    domain: string,
    projectId: number,
  ): Promise<any | null> {
    const result = await this.prisma.customDomain.findFirst({
      where: { domain, projectId },
    });
    return result;
  }
}
