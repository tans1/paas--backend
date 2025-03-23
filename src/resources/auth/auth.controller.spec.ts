import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { LoginService } from './login/login.service';
import { RegisterService } from './register/register.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { NotFoundException } from '@nestjs/common';

describe('AuthController', () => {
  let authController: AuthController;
  let loginService: LoginService;
  let registerService: RegisterService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: LoginService,
          useValue: {
            logIn: jest.fn(),
          },
        },
        {
          provide: RegisterService,
          useValue: {
            register: jest.fn(),
          },
        },
      ],
    }).compile();

    authController = module.get<AuthController>(AuthController);
    loginService = module.get<LoginService>(LoginService);
    registerService = module.get<RegisterService>(RegisterService);
  });

  it('should be defined', () => {
    expect(authController).toBeDefined();
  });

  describe('signIn', () => {
    it('should call loginService.logIn with the correct parameters', async () => {
      const loginDto: LoginDto = { email: 'test@example.com', password: 'password' };
      const result = { access_token: 'jwt-token' };
      jest.spyOn(loginService, 'logIn').mockResolvedValue(result);

      expect(await authController.signIn(loginDto)).toBe(result);
      expect(loginService.logIn).toHaveBeenCalledWith(loginDto.email, loginDto.password);
    });

    it('should throw an error if login fails', async () => {
      const loginDto: LoginDto = { email: 'test@example.com', password: 'wrong-password' };
      jest.spyOn(loginService, 'logIn').mockImplementation(() => {
        throw new NotFoundException('User not found');
      });

      await expect(authController.signIn(loginDto)).rejects.toThrow('User not found');
    });
  });

  describe('signUp', () => {
    it('should call registerService.register with the correct parameters', async () => {
      const registerDto: RegisterDto = { email: 'test@example.com', password: 'password', name: 'Test User', role: 'user' };
      const result = { id: 'user-id', ...registerDto, createdAt: new Date() };
      jest.spyOn(registerService, 'register').mockResolvedValue(result);

      expect(await authController.signUp(registerDto)).toBe(result);
      expect(registerService.register).toHaveBeenCalledWith(expect.objectContaining(registerDto));
    });

    it('should throw an error if registration fails', async () => {
      const registerDto: RegisterDto = { email: 'test@example.com', password: 'password', name: 'Test User', role: 'user' };
      jest.spyOn(registerService, 'register').mockImplementation(() => {
        throw new NotFoundException('Registration failed');
      });

      await expect(authController.signUp(registerDto)).rejects.toThrow('Registration failed');
    });
  });
});