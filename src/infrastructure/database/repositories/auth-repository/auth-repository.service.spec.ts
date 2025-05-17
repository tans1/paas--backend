import { Test, TestingModule } from '@nestjs/testing';
import { AuthRepositoryService } from './auth-repository.service';
import { PrismaService } from '../../prisma/prisma-service/prisma-service.service';
import { CreateUserDto } from '../../../../resources/users/dto/create-user.dto';

describe('AuthRepositoryService', () => {
  let service: AuthRepositoryService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthRepositoryService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
              upsert: jest.fn(),
              update: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<AuthRepositoryService>(AuthRepositoryService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should extend PrismaService', () => {
    expect(service instanceof PrismaService).toBe(true);
  });

  describe('findOneBy', () => {
    it('should call prisma.user.findUnique with correct parameters', async () => {
      const email = 'test@example.com';
      await service.findOneBy(email);
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email },
      });
    });
  });

  describe('create', () => {
    it('should call prisma.user.upsert with correct parameters', async () => {
      const userData: CreateUserDto = {
        email: 'test@example.com',
        password: 'hashedPassword',
        createdAt: new Date(),
      };
      await service.create(userData);
      expect(prismaService.user.upsert).toHaveBeenCalledWith({
        where: { email: userData.email },
        update: { password: userData.password },
        create: userData,
      });
    });
  });

  describe('updateByEmail', () => {
    it('should call prisma.user.update with correct parameters', async () => {
      const email = 'test@example.com';
      const userData: Partial<CreateUserDto> = {
        email: 'updated@example.com',
      };
      await service.updateByEmail(email, userData);
      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { email },
        data: userData,
      });
    });
  });
});
