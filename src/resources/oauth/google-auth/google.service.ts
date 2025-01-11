import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from 'src/resources/users/users.service';

@Injectable()
export class GoogleService {
  constructor(private jwtService: JwtService, private usersService: UsersService) {}

  async googleLogin(req) {
    if (!req.user) {
      throw new NotFoundException('No user information provided in the request.');
    }

    const { email, firstName: name } = req.user;
    let user;

    user = await this.usersService.findOneBy(email);
    
    if (!user) {
        user = await this.usersService.create({
          email,
          name,
        });
    }

    try {
      const payload = { sub: user.id, email: user.email, role: user.role };
      const access_token = await this.jwtService.signAsync(payload);
      return { access_token };
    } catch (error) {
      throw new InternalServerErrorException(
        'Error occurred while generating the JWT token.',
      );
    }
  }
}
