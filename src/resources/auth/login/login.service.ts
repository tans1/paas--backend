import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from 'src/resources/users/users.service';

@Injectable()
export class LoginService {

    constructor(private usersService: UsersService, private jwtService: JwtService) {

    }
    async logIn(email, pass) {
        const user = await this.usersService.findOneBy(email);
        if (user?.password !== pass) {
          throw new UnauthorizedException();
        }
        const payload = { sub: user.id, email: user.email,role:user.role };
        return {
          access_token: await this.jwtService.signAsync(payload),
        };
      }
}

// How will I interact with the database? using repository interface 
// Nothing I can do to make things better right?
// I have to study how the swapping between an interface and a concrete object takes place right.
