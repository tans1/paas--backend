import { Injectable } from '@nestjs/common';
import { UsersService } from 'src/resources/users/users.service';
import { CreateUserDto } from 'src/resources/users/dto/create-user.dto';

@Injectable()
export class RegisterService {
  constructor(private usersService: UsersService) {}
  async register(payload: any) {
    const user = await this.usersService.create(payload);
    return user;
  }
}
