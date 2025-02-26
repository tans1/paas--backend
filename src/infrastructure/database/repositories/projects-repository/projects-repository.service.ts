import { Injectable } from '@nestjs/common';
import { CreateProjectDTO, ProjectsRepositoryInterface, UpdateProjectDTO } from './../../interfaces/projects-repository-interface/projects-repository-interface.interface';
import { PrismaService } from '../../prisma/prisma-service/prisma-service.service';
import { Project } from '@prisma/client';

@Injectable()
export class ProjectsRepositoryService
  extends PrismaService
  implements ProjectsRepositoryInterface {
  constructor(private prisma: PrismaService) {  
    super();
  }
  async findByUserId(userId: number): Promise<Project[]> {
    const userProjects = await this.prisma.project.findMany({
      where: {
        linkedByUserId: userId, 
      },
      include: { deployments: true },
    });

    return userProjects;
    
  }
  async create(payload: CreateProjectDTO): Promise<Project> {
    return await this.prisma.project.create({ data: payload });
  }
  async findByRepoId(id: number): Promise<Project | null> {
    return await this.prisma.project.findUnique({ where: { repoId: id } });
  }
  async findById(id: number): Promise<Project | null> {
    throw new Error('Method not implemented.');
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
}
