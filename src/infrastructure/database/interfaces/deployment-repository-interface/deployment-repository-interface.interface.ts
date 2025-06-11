import { Deployment, DeploymentLog } from '@prisma/client';

export interface CreateDeploymentDTO {
  projectId: number;
  status: string;
  branch: string;
  environmentVariables?: any;
  rollbackToId?: number;
  lastCommitMessage: string;
  extension: string;
}

export interface UpdateDeploymentDTO {
  status?: string;
  branch?: string;
  environmentVariables?: any;
  rollbackToId?: number;
  imageName?: string;
  containerName?: string;
}

export interface CreateDeploymentLogDTO {
  deploymentId: number;
  logLevel: string;
  message: string;
  logType: string;
}

export abstract class DeploymentRepositoryInterface {
  abstract create(payload: CreateDeploymentDTO): Promise<Deployment>;
  abstract findById(id: number): Promise<Deployment | null>;
  abstract update(
    id: number,
    payload: UpdateDeploymentDTO,
  ): Promise<Deployment>;
  abstract delete(id: number): Promise<void>;
  abstract list(filters?: Partial<Deployment>): Promise<Deployment[]>;
  abstract addLog(payload: CreateDeploymentLogDTO): Promise<DeploymentLog>;
  abstract getLogsByDeploymentId(
    deploymentId: number,
  ): Promise<DeploymentLog[]>;
}
