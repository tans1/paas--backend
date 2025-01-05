import { Injectable } from '@nestjs/common';
import { UsersRepositoryInterface } from 'src/infrastructure/database/interfaces/users-repository-interface/users-repository-interface.interface';

@Injectable()
export class UsersService {
    constructor(private usersRepository : UsersRepositoryInterface){

    }
    async create(payload: any) {
        return this.usersRepository.create(payload);
        
    }
    
    async findAll() {
        return `This action returns all users`;
    }
    
    async findOneBy(email: string) {
        return this.usersRepository.findOneBy(email);
    }
    
    async update(id: number, payload: any) {
        return `This action updates a #${id} user`;
    }
    
    async remove(id: number) {
        return `This action removes a #${id} user`;
    }
}