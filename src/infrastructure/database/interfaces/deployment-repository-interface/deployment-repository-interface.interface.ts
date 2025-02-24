import { Deployment, DeploymentLog } from '@prisma/client';

export interface CreateDeploymentDTO {
  repoId: number;
  status: string;
  branch: string;
  environmentVariables?: any; 
  rollbackToId?: number;
}

export interface UpdateDeploymentDTO {
  status?: string;
  branch?: string;
  environmentVariables?: any;
  rollbackToId?: number;
}

export interface CreateDeploymentLogDTO {
  deploymentId: number;
  logLevel: string;
  message: string;
}

export abstract class DeploymentRepositoryInterface {
  abstract create(payload: CreateDeploymentDTO): Promise<Deployment>;
  abstract findById(id: number): Promise<Deployment | null>;
  abstract update(id: number, payload: UpdateDeploymentDTO): Promise<Deployment>;
  abstract delete(id: number): Promise<void>;
  abstract list(filters?: Partial<Deployment>): Promise<Deployment[]>;
  abstract addLog(payload: CreateDeploymentLogDTO): Promise<DeploymentLog>;
  abstract getLogsByDeploymentId(deploymentId: number): Promise<DeploymentLog[]>;
}


