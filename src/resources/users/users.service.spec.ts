import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { UsersRepositoryInterface } from '../../infrastructure/database/interfaces/users-repository-interface/users-repository-interface.interface';

describe('UsersService', () => {
  let service: UsersService;
  let repository: jest.Mocked<UsersRepositoryInterface>;

  beforeEach(async () => {
    const mockRepository = {
      create: jest.fn(),
      findOneBy: jest.fn(),
      updateByEmail: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: UsersRepositoryInterface,
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repository = module.get(UsersRepositoryInterface) as jest.Mocked<UsersRepositoryInterface>;
  });

  describe('create', () => {
    it('should call repository.create with the payload', async () => {
      const payload = { email: 'test@example.com', password: 'password' };
      await service.create(payload);
      expect(repository.create).toHaveBeenCalledWith(payload);
    });
  });

  describe('findAll', () => {
    it('should return a message', async () => {
      const result = await service.findAll();
      expect(result).toBe('This action returns all users');
    });
  });

  describe('findOneBy', () => {
    it('should call repository.findOneBy with the email', async () => {
      const email = 'test@example.com';
      await service.findOneBy(email);
      expect(repository.findOneBy).toHaveBeenCalledWith(email);
    });
  });

  describe('update', () => {
    it('should return a message with the id', async () => {
      const id = 1;
      const payload = { name: 'Updated Name' };
      const result = await service.update(id, payload);
      expect(result).toBe(`This action updates a #${id} user`);
    });
  });

  describe('updateByEmail', () => {
    it('should call repository.updateByEmail with email and payload', async () => {
      const email = 'test@example.com';
      const payload = { name: 'Updated Name' };
      await service.updateByEmail(email, payload);
      expect(repository.updateByEmail).toHaveBeenCalledWith(email, payload);
    });
  });

  describe('remove', () => {
    it('should return a message with the id', async () => {
      const id = 1;
      const result = await service.remove(id);
      expect(result).toBe(`This action removes a #${id} user`);
    });
  });
});
