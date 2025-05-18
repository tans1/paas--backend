// import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
// import { PrismaService } from '../prisma/prisma.service';
// import { ContainerRecoveryService } from './manage-containers/container-recovery.service';

// @Injectable()
// export class ContainerRuntimeLogService implements OnApplicationBootstrap {
//   private readonly logger = new Logger(ContainerRuntimeLogService.name);

//   constructor(
//     private readonly prisma: PrismaService,
//     private readonly containerRecoveryService: ContainerRecoveryService,
//   ) {}

//   async onApplicationBootstrap() {
//     try {
//       // The container recovery service will handle the recovery process
//       // as it implements OnModuleInit
//       this.logger.log('Container runtime log service initialized');
//     } catch (error) {
//       this.logger.error(
//         `Failed to initialize container runtime log service: ${error.message}`,
//       );
//     }
//   }

//   async updateContainerStatus(
//     containerId: string,
//     status: string,
//     message: string,
//   ): Promise<void> {
//     try {
//       await this.prisma.containerRuntimeLog.update({
//         where: { containerId },
//         data: {
//           status,
//           lastStatusUpdate: new Date(),
//           lastStatusMessage: message,
//         },
//       });

//       // If container crashed, handle the recovery
//       if (status === 'crashed') {
//         await this.containerRecoveryService.handleContainerCrash(
//           containerId,
//           new Error(message),
//         );
//       }
//     } catch (error) {
//       this.logger.error(`Failed to update container status: ${error.message}`);
//       throw error;
//     }
//   }

//   async createContainerLog(data: {
//     containerId: string;
//     projectId: number;
//     status: string;
//     message?: string;
//   }): Promise<void> {
//     try {
//       await this.prisma.containerRuntimeLog.create({
//         data: {
//           containerId: data.containerId,
//           projectId: data.projectId,
//           status: data.status,
//           lastStatusUpdate: new Date(),
//           lastStatusMessage: data.message || 'Container created',
//         },
//       });
//     } catch (error) {
//       this.logger.error(`Failed to create container log: ${error.message}`);
//       throw error;
//     }
//   }

//   async getContainerStatus(containerId: string): Promise<string | null> {
//     try {
//       const log = await this.prisma.containerRuntimeLog.findUnique({
//         where: { containerId },
//         select: { status: true },
//       });
//       return log?.status || null;
//     } catch (error) {
//       this.logger.error(`Failed to get container status: ${error.message}`);
//       return null;
//     }
//   }pro
// }
