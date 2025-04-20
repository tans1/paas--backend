import { Injectable } from '@nestjs/common';
import { CreateProjectDTO, ProjectsRepositoryInterface, UpdateProjectDTO,ProjectWithDeploymentsAndUser } from './../../interfaces/projects-repository-interface/projects-repository-interface.interface';
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
    return await this.prisma.project.upsert({
      where: {
        repoId_branch: {
          repoId: payload.repoId,
          branch: payload.branch,
        },
      },
      update: {
        environmentVariables: payload.environmentVariables,
      },
      create: payload,
    });
  }
  
  

  async findByRepoAndBranch(
    repoId: number,
    branch: string,
  ): Promise<ProjectWithDeploymentsAndUser | null> {
    return await this.prisma.project.findUnique({
      where: {
        repoId_branch: {
          repoId,
          branch,
        },
      },
      include: {
        deployments: true,
        linkedByUser: true,
      },
    });
  }
  
  async findById(id: number): Promise<Project | null> {
    return await this.prisma.project.findUnique({
      where: { id },
    });
  }
  update(id: number, payload: UpdateProjectDTO): Promise<Project> {
    return this.prisma.project.update({ where: { id }, data: payload });
  }
  delete(id: number): Promise<void> {
    throw new Error('Method not implemented.');
  }
  list(filters?: Partial<Project>): Promise<Project[]> {
    throw new Error('Method not implemented.');
  }
  addDeployment(projectId: number, deploymentId: number): Promise<void> {
    throw new Error('Method not implemented.');
  }
  getAllDeployments(projectid:number): Promise<Project> {
    return this.prisma.project.findUnique({
      where: {
        id: projectid,
      },
      include: {
        deployments: true,
      },
    });
  }
}
