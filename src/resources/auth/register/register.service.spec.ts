import { Test, TestingModule } from '@nestjs/testing';
import { RegisterService } from './register.service';
import { UsersService } from 'src/resources/users/users.service';
import { CreateUserDto } from 'src/resources/users/dto/create-user.dto';

describe('RegisterService', () => {
  let service: RegisterService;
  let usersService: UsersService;

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

    service = module.get<RegisterService>(RegisterService);
    usersService = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('should call usersService.create with the correct parameters and return the result', async () => {
      const createUserDto: CreateUserDto = { email: 'test@example.com', password: 'password', createdAt: new Date() };
      const user = { id: 'user-id', ...createUserDto };
      jest.spyOn(usersService, 'create').mockResolvedValue(user);

      expect(await service.register(createUserDto)).toBe(user);
      expect(usersService.create).toHaveBeenCalledWith(createUserDto);
    });

    it('should throw an error if usersService.create fails', async () => {
      const createUserDto: CreateUserDto = { email: 'test@example.com', password: 'password', createdAt: new Date() };
      jest.spyOn(usersService, 'create').mockImplementation(() => {
        throw new Error('User creation failed');
      });

      await expect(service.register(createUserDto)).rejects.toThrow('User creation failed');
    });
  });
});