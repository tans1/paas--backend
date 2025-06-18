import { Test, TestingModule } from '@nestjs/testing';
import { RegisterService } from './register.service';
import { UsersService } from '../../users/users.service';

describe('RegisterService', () => {
  let registerService: RegisterService;
  let usersService: jest.Mocked<UsersService>;

  const mockUser = {
    id: 'user123',
    email: 'test@example.com',
    password: 'hashedPassword',
    role: 'user',
  };

  const mockCreateUserDto = {
    email: 'test@example.com',
    password: 'password123',
    role: 'user',
    createdAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RegisterService,
        {
          provide: UsersService,
          useValue: {
            create: jest.fn(),
          },
        },
      ],
    }).compile();

    registerService = module.get<RegisterService>(RegisterService);
    usersService = module.get(UsersService) as jest.Mocked<UsersService>;

    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should successfully register a new user', async () => {
      usersService.create.mockResolvedValue(mockUser);

      const result = await registerService.register(mockCreateUserDto);

      expect(usersService.create).toHaveBeenCalledWith(mockCreateUserDto);
      expect(result).toEqual(mockUser);
    });
  });
});
