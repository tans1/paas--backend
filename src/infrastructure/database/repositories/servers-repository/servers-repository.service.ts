import { Injectable } from '@nestjs/common';
import {ServersRepositoryInterface} from './../../interfaces/servers-repository-interface/servers-repository-interface.interface' 
import { PrismaService } from '../../prisma-service/prisma-service.service';

@Injectable()
export class ServersRepositoryService 
  extends PrismaService 
  implements ServersRepositoryInterface {}
