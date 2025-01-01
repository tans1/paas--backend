import { Injectable } from '@nestjs/common';
import {AuthRepositoryInterface} from './../../interfaces/auth-repository-interface/auth-repository-interface.interface' 
import { PrismaService } from '../../prisma-service/prisma-service.service';
@Injectable()
export class AuthRepositoryService 
  extends PrismaService 
  implements AuthRepositoryInterface {}
