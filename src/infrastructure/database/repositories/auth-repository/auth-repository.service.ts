import { Injectable } from '@nestjs/common';
import { AuthRepositoryInterface } from './../../interfaces/auth-repository-interface/auth-repository-interface.interface';
import { PrismaService } from '../../prisma/prisma-service/prisma-service.service';
import { CreateUserDto } from '@/resources/users/dto/create-user.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class AuthRepositoryService
  extends PrismaService
  implements AuthRepositoryInterface {
  async findOneBy(email: string) {
    return this.user.findUnique({
      where: { email },
    });
  }

  async create(userData: CreateUserDto) {
    const { id, confirmPassword, ...data } = userData;
    return this.user.create({
      data: {
        ...data,
        name: data.email.split('@')[0], // Default name from email
        role: 'user', // Default role
      },
    });
  }

  async updateByEmail(email: string, userData: Partial<CreateUserDto>) {
    const { id, confirmPassword, ...data } = userData;
    return this.user.update({
      where: { email },
      data,
    });
  }
}
