import { Test, TestingModule } from '@nestjs/testing';
import { RegisterService } from './register.service';
import { UsersService } from 'src/resources/users/users.service';
import { CreateUserDto } from 'src/resources/users/dto/create-user.dto';

describe('RegisterService', () => {
  let registerService: RegisterService;
  let usersService: UsersService;

  // Mock UsersService
  const mockUsersService = {
    create: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RegisterService,
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    registerService = module.get<RegisterService>(RegisterService);
    usersService = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should call usersService.create with the provided payload and return the created user', async () => {
      // Arrange
      const createUserDto: CreateUserDto = {
        email: 'test@example.com',
        password: 'password123',
        createdAt: undefined
      };

      const mockUser = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
      };

      mockUsersService.create.mockResolvedValue(mockUser);

      // Act
      const result = await registerService.register(createUserDto);

      // Assert
      expect(usersService.create).toHaveBeenCalledWith(createUserDto);
      expect(usersService.create).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockUser);
    });

    it('should throw an error if usersService.create fails', async () => {
      // Arrange
      const createUserDto: CreateUserDto = {
        email: 'test@example.com',
        password: 'password123',
        createdAt: undefined
      };

      const errorMessage = 'Failed to create user';
      mockUsersService.create.mockRejectedValue(new Error(errorMessage));

      // Act & Assert
      await expect(registerService.register(createUserDto)).rejects.toThrow(
        errorMessage,
      );
      expect(usersService.create).toHaveBeenCalledWith(createUserDto);
      expect(usersService.create).toHaveBeenCalledTimes(1);
    });
  });
});