// import { GithubRepositoryInterface } from '@/infrastructure/database/interfaces/github-repository-interface/github-repository-interface.interface';
import {
  Injectable,
  InternalServerErrorException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../../users/users.service';

@Injectable()
export class GithubService {
  constructor(
    private jwtService: JwtService,
    private usersService: UsersService,
    // private readonly githubRepository: GithubRepositoryInterface
  ) {}

  async githubLogin(req) {
    if (!req.user) {
      throw new NotFoundException('No user data available in the request.');
    }

    const { email, name, username, accessToken } = req.user;
    let user;

    try {
      user = await this.usersService.findOneBy(email);
    } catch (e) {
      console.log(e);
    }

    if (!user) {
      user = await this.usersService.create({
        email,
        name,
        githubUsername: username,
        githubAccessToken: accessToken,
      });
    } else {
      await this.usersService.updateByEmail(email, {
        githubUsername: username,
        githubAccessToken: accessToken,
      });
    }

    try {
      // const existingToken = await this.githubRepository.getAccessToken(username);
      // if (existingToken) {
      //   await this.githubRepository.updateAccessToken(username, accessToken);
      // } else {
      //   await this.githubRepository.create(username, accessToken);
      // }

      const payload = { sub: user.id, email: user.email, role: user.role };
      const jwt_token = await this.jwtService.signAsync(payload);

      return { jwt_token, username };
    } catch (e) {
      throw new InternalServerErrorException(
        'Error occurred while generating the JWT token.',
      );
    }
  }
}
