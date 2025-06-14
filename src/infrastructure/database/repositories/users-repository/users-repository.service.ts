import {
  HttpException,
  Injectable,
  BadRequestException,
  InternalServerErrorException,
  ConflictException,
} from '@nestjs/common';
import { UpdateUserDto, UsersRepositoryInterface } from './../../interfaces/users-repository-interface/users-repository-interface.interface';
import { PrismaService } from '../../prisma/prisma-service/prisma-service.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersRepositoryService implements UsersRepositoryInterface {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    try {
      const users = await this.prisma.user.findMany();

      return users;
    } catch (error) {
      console.error('Error fetching user by id:', error);
      throw new InternalServerErrorException(
        'Failed to fetch users. Please try again later.',
      );
    }
  }
  async findOneById(id: number) {
    try {
      const user = await this.prisma.user.findUnique({
        where: {
          id: id,
        },
      });

      return user;
    } catch (error) {
      console.error('Error fetching user by id:', error);
      throw new InternalServerErrorException(
        'Failed to fetch user. Please try again later.',
      );
    }
  }
  async findOneBy(email: string) {
    try {
      const user = await this.prisma.user.findUnique({
        where: {
          email: email,
        },
      });

      return user;
    } catch (error) {
      console.error('Error fetching user by email:', error);
      throw new InternalServerErrorException(
        'Failed to fetch user. Please try again later.',
      );
    }
  }

  async create(payload: any) {
    try {
      const password = payload.password;
      if (password) {
        const salt = await bcrypt.genSalt();
        const hashedPassword = await bcrypt.hash(password, salt);
        payload.password = hashedPassword;
      }
      return await this.prisma.user.upsert({
        where: { email: payload.email },
        update: { password: payload.password },
        create: payload,
      });
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException('A user with this email already exists.');
      }
      console.error('Error creating user:', error);
      throw new InternalServerErrorException(
        'Failed to create user. Please try again later.',
      );
    }
  }

  async findOneByUserName(userName: string) {
    try {
      const user = await this.prisma.user.findUnique({
        where: {
          githubUsername: userName,
        },
      });
      if (!user) {
        throw new BadRequestException(
          `User with userName ${userName} not found.`,
        );
      }
      return user;
    } catch (error) {
      console.error('Error fetching user by userName:', error);
      throw new InternalServerErrorException(
        'Failed to fetch user. Please try again later.',
      );
    }
  }

  async updateByEmail(email: string, payload: any) {
    try {
      return await this.prisma.user.update({
        where: {
          email: email,
        },
        data: payload,
      });
    } catch (error) {
      console.error('Error updating user by email:', error);
      throw new InternalServerErrorException(
        'Failed to update user. Please try again later.',
      );
    }
  }

  async update(id: number, payload: UpdateUserDto) {
    
    try {
     
      return await this.prisma.user.update({
        where: {
          id: id,
        },
        data: payload,
      });
    } catch (error) {
      console.error('Error updating user by id:', error);
      throw new InternalServerErrorException(
        'Failed to update user. Please try again later.',
      );
    }
  }

  async remove(id: number) {
    try {
      return await this.prisma.user.delete({
        where: {
          id: id,
        },
      });
    } catch (error) {
      console.error('Error deleting user:', error);
      throw new InternalServerErrorException(
        'Failed to delete user. Please try again later.',
      );
    }
  }
}
