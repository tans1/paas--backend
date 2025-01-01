import { Injectable } from '@nestjs/common';
import {ProjectsRepositoryInterface} from './../../interfaces/projects-repository-interface/projects-repository-interface.interface' 
import { PrismaService } from '../../prisma-service/prisma-service.service';

@Injectable()
export class ProjectsRepositoryService 
  extends PrismaService 
  implements ProjectsRepositoryInterface {}
