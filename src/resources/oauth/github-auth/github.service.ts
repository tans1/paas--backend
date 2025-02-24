import {
  Injectable,
  InternalServerErrorException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from 'src/resources/users/users.service';

@Injectable()
export class GithubService {
  constructor(
    private jwtService: JwtService,
    private usersService: UsersService,
  ) {}

  async githubLogin(req) {
    if (!req.user) {
      throw new NotFoundException('No user data available in the request.');
    }

    const { email, name,username } = req.user;
    let user;

    try{

      user = await this.usersService.findOneBy(email);
    }
    catch(e){
      console.log(e);
    }

    if (!user) {
      user = await this.usersService.create({ email, name,githubUsername :username });
    }

    try {
      const payload = { sub: user.id, email: user.email, role: user.role };
      const access_token = await this.jwtService.signAsync(payload);

      return { access_token,username };
    } catch (e) {
      throw new InternalServerErrorException(
        'Error occurred while generating the JWT token.',
      );
    }
  }
}
