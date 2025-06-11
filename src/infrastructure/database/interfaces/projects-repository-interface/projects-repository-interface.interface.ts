import { Prisma, Project, ProjectStatus } from '@prisma/client';

export interface CreateProjectDTO {
  name: string;
  repoId: number;
  url: string;
  linkedByUserId: number;
  environmentVariables?: Record<string, string>;
  branch: string;
  framework: string;
  installCommand?: string;
  buildCommand?: string;
  runCommand? : string;
  outputDirectory?: string;
  rootDirectory?: string;
  projectDescription?: string;
  lastCommitMessage: string;
}

export interface UpdateProjectDTO {
  name?: string;
  url?: string;
  deployedIp?: string;
  deployedPort?: number;
  deployedUrl?: string;
  activeDeploymentId?: number;
  localRepoPath?: string;
  zoneId?: string;
  aRecordId?: string;
  cnameRecordId?: string;
  lastCommitMessage?: string;
  status?: ProjectStatus;
  dockerComposeFile?: string;
  PORT?: number;
  environmentVariables?: Record<string, string>;
}

export type ProjectWithDeploymentsAndUser = Prisma.ProjectGetPayload<{
  include: {
    deployments: true;
    linkedByUser: true;
  };
}>;

export interface CreateCustomDomain {
  domain: string;
  projectId: number;
}

export interface UpdateCustomDomain {
  live: boolean;
}

export const StatusEnum = ProjectStatus;
// export type StatusEnum = keyof typeof statusValues;

export abstract class ProjectsRepositoryInterface {
  abstract create(payload: CreateProjectDTO): Promise<Project>;
  // abstract findByRepoId(id: number): Promise<ProjectWithDeployments | null>;
  abstract findByRepoAndBranch(
    repoId: number,
    branch: string,
  ): Promise<ProjectWithDeploymentsAndUser | null>;
  abstract findByUserId(id: number): Promise<Project[]>;
  abstract findById(id: number): Promise<ProjectWithDeploymentsAndUser | null>;
  abstract update(id: number, payload: UpdateProjectDTO): Promise<Project>;
  abstract delete(id: number): Promise<void>;
  abstract list(filters?: Partial<Project>): Promise<Project[]>;
  abstract addDeployment(
    projectId: number,
    deploymentId: number,
  ): Promise<void>;
  abstract getAllDeployments(projectid: number): Promise<Project>;
  abstract getAllProjects(): Promise<ProjectWithDeploymentsAndUser[]>;
  abstract createCustomDomain(payload: CreateCustomDomain): Promise<void>;
  abstract updateCustomDomain(
    domainId: number,
    payload: UpdateCustomDomain,
  ): Promise<void>;
  abstract findCustomDomainByDomainAndProjectId(
    domain: string,
    projectId: number,
  ): Promise<any | null>;
}
