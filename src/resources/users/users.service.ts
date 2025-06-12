import { Injectable } from '@nestjs/common';
import { UsersRepositoryInterface } from '../../infrastructure/database/interfaces/users-repository-interface/users-repository-interface.interface';

@Injectable()
export class UsersService {
  constructor(private usersRepository: UsersRepositoryInterface) {}
  async create(payload: any) {
    return this.usersRepository.create(payload);
  }

  async findAll() {
    return `This action returns all users`;
  }

  async findOneById(id: number) {
    return await this.usersRepository.findOneById(id);
  }
  async findOneBy(email: string) {
    return await this.usersRepository.findOneBy(email);
  }

  async update(id: number, payload: any) {
    return `This action updates a #${id} user`;
  }

  async updateByEmail(email: string, payload: any) {
    return this.usersRepository.updateByEmail(email, payload);
  }

  async remove(id: number) {
    return `This action removes a #${id} user`;
  }
}
