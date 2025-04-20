import { Prisma, Project } from '@prisma/client';

export interface CreateProjectDTO {
  name: string;
  repoId: number;
  url: string;
  linkedByUserId: number;
  environmentVariables?: Record<string, string>; 
  branch: string;
}

export interface UpdateProjectDTO {
  name?: string;
  url?: string;
  deployedIp?: string;
  deployedPort?: number;
  deployedUrl?: string;

}

export type ProjectWithDeploymentsAndUser = Prisma.ProjectGetPayload<{
  include: {
    deployments: true;
    linkedByUser: true;
  };
}>;

export abstract class ProjectsRepositoryInterface {
  abstract create(payload: CreateProjectDTO): Promise<Project>;
  // abstract findByRepoId(id: number): Promise<ProjectWithDeployments | null>;
  abstract findByRepoAndBranch(repoId: number,branch: string,): Promise<ProjectWithDeploymentsAndUser | null>;
  abstract findByUserId(id: number): Promise<Project[]>;
  abstract findById(id: number): Promise<Project | null>;
  abstract update(id: number, payload: UpdateProjectDTO): Promise<Project>;
  abstract delete(id: number): Promise<void>;
  abstract list(filters?: Partial<Project>): Promise<Project[]>;
  abstract addDeployment(projectId: number, deploymentId: number): Promise<void>;
  abstract getAllDeployments(projectid:number): Promise<Project> 
}


