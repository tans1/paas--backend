import { Injectable } from '@nestjs/common';
import { UsersRepositoryInterface } from './../../interfaces/users-repository-interface/users-repository-interface.interface';
import { PrismaService } from '../../prisma/prisma-service/prisma-service.service';
import * as bcrypt from 'bcrypt';
@Injectable()
export class UsersRepositoryService implements UsersRepositoryInterface {
  constructor(private prisma: PrismaService) {}

  async findOneBy(email: string) {
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
  async create(payload: any) {

    try{
      // has passoword 
      const password = payload.password;
      const salt = await bcrypt.genSalt();
      const hashedPassword = await bcrypt.hash(password, salt);
      payload.password = hashedPassword
       return this.prisma.user.create({
        data: payload,
      });
    }
    catch(e){
      console.log(e)
    }
  }
}
