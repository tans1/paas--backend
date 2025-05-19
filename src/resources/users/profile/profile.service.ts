import { Injectable } from '@nestjs/common';
import { UsersService } from '../users.service';

@Injectable()
export class ProfileService {
    constructor(
        private userService: UsersService, 
    ){}

    // getUser(id: number){
    //     return this.userService.findOneById(id)
    // }

}
