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
  async create(payload: CreateProjectDTO): Promise<Project> {
    return await this.prisma.project.create({ data: payload });
  }
  findById(id: number): Promise<Project | null> {
    throw new Error('Method not implemented.');
  }
  update(id: number, payload: UpdateProjectDTO): Promise<Project> {
    throw new Error('Method not implemented.');
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
