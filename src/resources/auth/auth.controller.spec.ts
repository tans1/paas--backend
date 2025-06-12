import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { LoginService } from './login/login.service';
import { RegisterService } from './register/register.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { BaseUser } from '../users/dto/base-user.dto';

describe('AuthController', () => {
  let controller: AuthController;
  let loginService: LoginService;
  let registerService: RegisterService;

  const mockLoginService = {
    logIn: jest.fn(),
  };

  const mockRegisterService = {
    register: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: LoginService,
          useValue: mockLoginService,
        },
        {
          provide: RegisterService,
          useValue: mockRegisterService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    loginService = module.get<LoginService>(LoginService);
    registerService = module.get<RegisterService>(RegisterService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('signIn', () => {
    it('should call loginService.logIn with correct parameters', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      const expectedResponse: BaseUser = {
        id: '1',
        email: 'test@example.com',
        password: 'hashedPassword',
        designation: 'Developer',
      };

      mockLoginService.logIn.mockResolvedValue(expectedResponse);

      const result = await controller.signIn(loginDto);

      expect(mockLoginService.logIn).toHaveBeenCalledWith(
        loginDto.email,
        loginDto.password,
      );
      expect(result).toEqual(expectedResponse);
    });

    it('should handle login failure', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      mockLoginService.logIn.mockRejectedValue(new Error('Invalid credentials'));

      await expect(controller.signIn(loginDto)).rejects.toThrow('Invalid credentials');
    });
  });

  describe('signUp', () => {
    it('should call registerService.register with correct parameters', async () => {
      const registerDto: RegisterDto = {
        email: 'newuser@example.com',
        password: 'password123',
        name: 'New User',
        role: 'user',
      };

      const expectedResponse: BaseUser = {
        id: '2',
        email: 'newuser@example.com',
        password: 'hashedPassword',
        designation: 'User',
      };

      mockRegisterService.register.mockResolvedValue(expectedResponse);

      const result = await controller.signUp(registerDto);

      expect(mockRegisterService.register).toHaveBeenCalledWith({
        ...registerDto,
        createdAt: expect.any(Date),
      });
      expect(result).toEqual(expectedResponse);
    });

    it('should handle registration failure', async () => {
      const registerDto: RegisterDto = {
        email: 'existing@example.com',
        password: 'password123',
        name: 'Existing User',
        role: 'user',
      };

      mockRegisterService.register.mockRejectedValue(
        new Error('Email already exists'),
      );

      await expect(controller.signUp(registerDto)).rejects.toThrow(
        'Email already exists',
      );
    });
  });
});
