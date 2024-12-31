import { Injectable } from '@nestjs/common';
import {UsersRepositoryInterface} from './../../interfaces/users-repository-interface/users-repository-interface.interface' 
import { PrismaService } from '../../prisma-service/prisma-service.service';

@Injectable()
export class UsersRepositoryService
  extends PrismaService
  implements UsersRepositoryInterface {}
