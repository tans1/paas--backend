import { Injectable } from '@nestjs/common';
import { CreateDeploymentDTO, CreateDeploymentLogDTO, DeploymentRepositoryInterface, UpdateDeploymentDTO } from '../../interfaces/deployment-repository-interface/deployment-repository-interface.interface';
import { Deployment, DeploymentLog } from '@prisma/client';

@Injectable()
export class DeploymentRepositoryService implements DeploymentRepositoryInterface {
    create(payload: CreateDeploymentDTO): Promise<Deployment> {
        throw new Error('Method not implemented.');
    }
    findById(id: number): Promise<Deployment | null> {
        throw new Error('Method not implemented.');
    }
    update(id: number, payload: UpdateDeploymentDTO): Promise<Deployment> {
        throw new Error('Method not implemented.');
    }
    delete(id: number): Promise<void> {
        throw new Error('Method not implemented.');
    }
    list(filters?: Partial<Deployment>): Promise<Deployment[]> {
        throw new Error('Method not implemented.');
    }
    addLog(payload: CreateDeploymentLogDTO): Promise<DeploymentLog> {
        throw new Error('Method not implemented.');
    }
    getLogsByDeploymentId(deploymentId: number): Promise<DeploymentLog[]> {
        throw new Error('Method not implemented.');
    }

}
