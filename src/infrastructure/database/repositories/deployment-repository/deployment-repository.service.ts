import { Injectable } from '@nestjs/common';
import {
  CreateDeploymentDTO,
  CreateDeploymentLogDTO,
  DeploymentRepositoryInterface,
  UpdateDeploymentDTO,
} from '../../interfaces/deployment-repository-interface/deployment-repository-interface.interface';
import { Deployment, DeploymentLog } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma-service/prisma-service.service';

@Injectable()
export class DeploymentRepositoryService
  implements DeploymentRepositoryInterface
{
  constructor(private prisma: PrismaService) {}
  async create(payload: CreateDeploymentDTO): Promise<Deployment> {
    const { rollbackToId, ...rest } = payload;

    const data: any = { ...rest };

    if (rollbackToId) {
      data.rollbackTo = { connect: { id: rollbackToId } };
    }

    return await this.prisma.deployment.create({ data });
  }
  findById(id: number): Promise<Deployment | null> {
    return this.prisma.deployment.findUnique(
     { where : {
        id 
      }}
    )
  }
  update(id: number, payload: UpdateDeploymentDTO): Promise<Deployment> {
    return this.prisma.deployment.update({
      where: { id },
      data: payload,
    });
  }
  delete(id: number): Promise<void> {
    throw new Error('Method not implemented.');
  }
  list(filters?: Partial<Deployment>): Promise<Deployment[]> {
    throw new Error('Method not implemented.');
  }
  async addLog(payload: CreateDeploymentLogDTO): Promise<DeploymentLog> {
    return await this.prisma.deploymentLog.create({
      data: {
        deploymentId: payload.deploymentId,
        logLevel: payload.logLevel,
        message: payload.message,
        timestamp: new Date(),
        logType: payload.logType
      },
    });
  }
  getLogsByDeploymentId(deploymentId: number): Promise<DeploymentLog[]> {
    throw new Error('Method not implemented.');
  }
}
