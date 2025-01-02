import { Injectable } from '@nestjs/common';
import { AdminRepositoryInterface } from './../../interfaces/admin-repository-interface/admin-repository-interface.interface';
import { PrismaService } from '../../prisma/prisma-service/prisma-service.service';

@Injectable()
export class AdminRepositoryService
  extends PrismaService
  implements AdminRepositoryInterface {}
