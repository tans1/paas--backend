import { Injectable } from '@nestjs/common';
import { UsersService } from '../../users/users.service';
import { CreateUserDto } from '../../users/dto/create-user.dto';

@Injectable()
export class RegisterService {
  constructor(private usersService: UsersService) {}
  async register(payload: CreateUserDto) {
    const user = await this.usersService.create(payload);
    return user;
  }
}
