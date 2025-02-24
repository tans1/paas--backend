import { Project } from '@prisma/client';

export interface CreateProjectDTO {
  name: string;
  url: string;
  linkedByUserId: number;
}

export interface UpdateProjectDTO {
  name?: string;
  url?: string;
  deployedIp?: string;
  deployedPort?: number;

}

export abstract class ProjectsRepositoryInterface {
  abstract create(payload: CreateProjectDTO): Promise<Project>;
  abstract findById(id: number): Promise<Project | null>;
  abstract update(id: number, payload: UpdateProjectDTO): Promise<Project>;
  abstract delete(id: number): Promise<void>;
  abstract list(filters?: Partial<Project>): Promise<Project[]>;
  abstract addDeployment(projectId: number, deploymentId: number): Promise<void>;
}

// It does make sense to create the project as soon as the person clicks deploy. we create the project
// when we deploy we create deployments and add them to the project's deployments list
// so we need a method for that as well. so we added that. 

