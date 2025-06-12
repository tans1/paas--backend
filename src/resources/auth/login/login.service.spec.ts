import { Test, TestingModule } from '@nestjs/testing';
import { LoginService } from './login.service';
import { UsersService } from '../../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

// Mock bcrypt
jest.mock('bcrypt');

describe('LoginService', () => {
  let loginService: LoginService;
  let usersService: jest.Mocked<UsersService>;
  let jwtService: jest.Mocked<JwtService>;

  const mockUser = {
    id: 'user123',
    email: 'test@example.com',
    password: 'hashedPassword',
    role: 'user',
  };

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

    loginService = module.get<LoginService>(LoginService);
    usersService = module.get(UsersService) as jest.Mocked<UsersService>;
    jwtService = module.get(JwtService) as jest.Mocked<JwtService>;

    jest.clearAllMocks();
  });

  describe('logIn', () => {
    it('should return access token for valid email and password', async () => {
      usersService.findOneBy.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      jwtService.signAsync.mockResolvedValue('access_token');

      const result = await loginService.logIn('test@example.com', 'password');

      expect(usersService.findOneBy).toHaveBeenCalledWith('test@example.com');
      expect(bcrypt.compare).toHaveBeenCalledWith('password', 'hashedPassword');
      expect(jwtService.signAsync).toHaveBeenCalledWith({
        sub: 'user123',
        email: 'test@example.com',
        role: 'user',
      });
      expect(result).toEqual({ access_token: 'access_token' });
    });

    it('should throw UnauthorizedException if user is not found', async () => {
      usersService.findOneBy.mockResolvedValue(null);

      await expect(loginService.logIn('test@example.com', 'password')).rejects.toThrow(
        UnauthorizedException,
      );
      expect(usersService.findOneBy).toHaveBeenCalledWith('test@example.com');
      expect(bcrypt.compare).not.toHaveBeenCalled();
      expect(jwtService.signAsync).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException if user has no password', async () => {
      usersService.findOneBy.mockResolvedValue({ ...mockUser, password: null });

      await expect(loginService.logIn('test@example.com', 'password')).rejects.toThrow(
        UnauthorizedException,
      );
      expect(usersService.findOneBy).toHaveBeenCalledWith('test@example.com');
      expect(bcrypt.compare).not.toHaveBeenCalled();
      expect(jwtService.signAsync).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException if password is invalid', async () => {
      usersService.findOneBy.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(loginService.logIn('test@example.com', 'wrongPassword')).rejects.toThrow(
        UnauthorizedException,
      );
      expect(usersService.findOneBy).toHaveBeenCalledWith('test@example.com');
      expect(bcrypt.compare).toHaveBeenCalledWith('wrongPassword', 'hashedPassword');
      expect(jwtService.signAsync).not.toHaveBeenCalled();
    });
  });
});