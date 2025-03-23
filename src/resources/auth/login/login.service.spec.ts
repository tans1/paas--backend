import { Test, TestingModule } from '@nestjs/testing';
import { LoginService } from './login.service';
import { UsersService } from 'src/resources/users/users.service';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

describe('LoginService', () => {
  let service: LoginService;
  let usersService: UsersService;
  let jwtService: JwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LoginService,
        {
          provide: UsersService,
          useValue: {
            findOneBy: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<LoginService>(LoginService);
    usersService = module.get<UsersService>(UsersService);
    jwtService = module.get<JwtService>(JwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('logIn', () => {
    it('should return an access token if credentials are valid', async () => {
      const email = 'test@example.com';
      const password = 'password';
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = { id: 'user-id', email, password: hashedPassword, role: 'user' };
      const token = 'jwt-token';

      jest.spyOn(usersService, 'findOneBy').mockResolvedValue(user);
      jest.spyOn(bcrypt, 'compare').mockImplementation(async () => true); // ✅ Fix here
      jest.spyOn(jwtService, 'signAsync').mockResolvedValue(token);

      const result = await service.logIn(email, password);

      expect(result).toEqual({ access_token: token });
      expect(usersService.findOneBy).toHaveBeenCalledWith(email);
      expect(bcrypt.compare).toHaveBeenCalledWith(password, user.password);
      expect(jwtService.signAsync).toHaveBeenCalledWith({ sub: user.id, email: user.email, role: user.role });
    });

    it('should throw UnauthorizedException if password is invalid', async () => {
      const email = 'test@example.com';
      const password = 'password';
      const user = { id: 'user-id', email, password: 'hashed-password', role: 'user' };

      jest.spyOn(usersService, 'findOneBy').mockResolvedValue(user);
      jest.spyOn(bcrypt, 'compare').mockImplementation(async () => false); // ✅ Fix here

      await expect(service.logIn(email, password)).rejects.toThrow(UnauthorizedException);
      expect(usersService.findOneBy).toHaveBeenCalledWith(email);
      expect(bcrypt.compare).toHaveBeenCalledWith(password, user.password);
    });

    it('should throw UnauthorizedException if user is not found', async () => {
      const email = 'test@example.com';
      const password = 'password';

      jest.spyOn(usersService, 'findOneBy').mockResolvedValue(null);

      await expect(service.logIn(email, password)).rejects.toThrow(UnauthorizedException);
      expect(usersService.findOneBy).toHaveBeenCalledWith(email);
    });
  });
});
