import { Injectable } from '@nestjs/common';
import { CreateDeploymentDTO, CreateDeploymentLogDTO, DeploymentRepositoryInterface, UpdateDeploymentDTO } from '../../interfaces/deployment-repository-interface/deployment-repository-interface.interface';
import { Deployment, DeploymentLog } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma-service/prisma-service.service';

// TODO: can not access resources in the deployed version
@Injectable()
export class DeploymentRepositoryService implements DeploymentRepositoryInterface {
    constructor(private prisma : PrismaService){}
    async create(payload: CreateDeploymentDTO): Promise<Deployment> {
        // Extract rollbackToId from the payload
        const { rollbackToId, ...rest } = payload;
      
        // Prepare the data for Prisma create
        const data: any = { ...rest };
      
        // If rollbackToId is provided, set the relation using nested connect
        if (rollbackToId) {
          data.rollbackTo = { connect: { id: rollbackToId } };
        }
      
        return await this.prisma.deployment.create({ data });
    }
    findById(id: number): Promise<Deployment | null> {
        throw new Error('Method not implemented.');
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
                timestamp: new Date(), // Default to current time if not provided
            },
        });
    }
    getLogsByDeploymentId(deploymentId: number): Promise<DeploymentLog[]> {
        throw new Error('Method not implemented.');
    }

}
