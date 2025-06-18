import { Injectable } from '@nestjs/common';
import { UsersRepositoryInterface } from 'src/infrastructure/database/interfaces/users-repository-interface/users-repository-interface.interface';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private usersRepository: UsersRepositoryInterface) {}
  async create(payload: any) {
    return this.usersRepository.create(payload);
  }

  async findAll() {
    return await this.usersRepository.findAll();
  }

  async findOneById(id: number) {
    return await this.usersRepository.findOneById(id);
  }
  async findOneBy(email: string) {
    return await this.usersRepository.findOneBy(email);
  }

  async update(payload: UpdateUserDto) {
    const { id, currentPassword, newPassword, ...rest } = payload;
    type UpdateData = Partial<UpdateUserDto> & { password?: string };
    const updateData: UpdateData = { ...rest };
    
    if (newPassword) {
      const user = await this.usersRepository.findOneById(id);
  
      const isCurrentPasswordValid = await bcrypt.compare(
        currentPassword,
        user.password
      );
      if (!isCurrentPasswordValid) {
        throw new Error('Confirm password is not valid');
      }
  
      const salt = await bcrypt.genSalt();
      updateData.password = await bcrypt.hash(newPassword, salt);
    }
  
    // 4) Perform the update, passing the id and the cleaned-up data
    return this.usersRepository.update(id, updateData);
  }
  

  async updateByEmail(email: string, payload: any) {
    return this.usersRepository.updateByEmail(email, payload);
  }

  async remove(id: number) {
    return this.usersRepository.remove(id);
  }
}
