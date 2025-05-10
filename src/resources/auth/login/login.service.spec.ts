import { Test, TestingModule } from '@nestjs/testing';
import { LoginService } from './login.service';
import { UsersService } from '../../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

describe('LoginService', () => {
  let loginService: LoginService;
  let usersService: jest.Mocked<UsersService>;
  let jwtService: jest.Mocked<JwtService>;

  const mockUsersService = {
    findOneBy: jest.fn(),
  };

  const mockJwtService = {
    signAsync: jest.fn(),
  };

  const mockUser = {
    id: '123',
    email: 'test@example.com',
    password: 'hashedPassword',
    role: 'user',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LoginService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    loginService = module.get<LoginService>(LoginService);
    usersService = module.get<UsersService>(UsersService) as jest.Mocked<UsersService>;
    jwtService = module.get<JwtService>(JwtService) as jest.Mocked<JwtService>;

    jest.spyOn(bcrypt, 'compare').mockReset(); // Reset bcrypt mock
  });

  afterEach(() => {
    jest.clearAllMocks(); // Clear all mocks to prevent memory leaks
    jest.spyOn(bcrypt, 'compare').mockRestore(); // Restore bcrypt to avoid lingering mocks
  });

  describe('logIn', () => {
    it('should throw UnauthorizedException if user is not found', async () => {
      usersService.findOneBy.mockResolvedValue(null);

      await expect(loginService.logIn('test@example.com', 'password')).rejects.toThrow(
        UnauthorizedException,
      );
      expect(usersService.findOneBy).toHaveBeenCalledWith('test@example.com');
    });

    it('should throw UnauthorizedException if password does not match', async () => {
      usersService.findOneBy.mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockImplementation(async () => false);

      await expect(loginService.logIn('test@example.com', 'wrongPassword')).rejects.toThrow(
        UnauthorizedException,
      );
      expect(usersService.findOneBy).toHaveBeenCalledWith('test@example.com');
      expect(bcrypt.compare).toHaveBeenCalledWith('wrongPassword', mockUser.password);
    });

    it('should return access token if credentials are valid', async () => {
      usersService.findOneBy.mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockImplementation(async () => true);
      const payload = { sub: mockUser.id, email: mockUser.email, role: mockUser.role };
      const accessToken = 'jwt.token.here';
      jwtService.signAsync.mockResolvedValue(accessToken);

      const result = await loginService.logIn('test@example.com', 'password');

      expect(result).toEqual({ access_token: accessToken });
      expect(usersService.findOneBy).toHaveBeenCalledWith('test@example.com');
      expect(bcrypt.compare).toHaveBeenCalledWith('password', mockUser.password);
      expect(jwtService.signAsync).toHaveBeenCalledWith(payload);
    });
  });
});