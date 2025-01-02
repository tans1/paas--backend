import { Injectable } from '@nestjs/common';
import { UsersRepositoryInterface } from './../../interfaces/users-repository-interface/users-repository-interface.interface';
import { PrismaService } from '../../prisma/prisma-service/prisma-service.service';

@Injectable()
export class UsersRepositoryService implements UsersRepositoryInterface {
  constructor(private prisma: PrismaService) {}

  findOneBy(email: string) {
    try{
      return this.prisma.user.findUnique({
        where: {
          email: email,
        },
      });
    }
    catch(e){
      console.log(e)
    }
  }
  create(payload: any) {

    try{
       return this.prisma.user.create({
        data: payload,
      });
    }
    catch(e){
      console.log(e)
    }
  }
}
