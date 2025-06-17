import { UsersRepositoryService } from './users-repository.service';
import { PrismaService } from '../../prisma/prisma-service/prisma-service.service';
import * as bcrypt from 'bcrypt';
import {
  InternalServerErrorException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';

describe('UsersRepositoryService', () => {
  let service: UsersRepositoryService;
  let prismaMock: any;

  beforeEach(() => {
    prismaMock = {
      user: {
        findUnique: jest.fn(),
        upsert: jest.fn(),
        update: jest.fn(),
      },
    };
    service = new UsersRepositoryService(prismaMock as PrismaService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.resetAllMocks();
  });

  describe('findOneById', () => {
    it('returns the user when found', async () => {
      const user = { id: 1, email: 'a@b.com' };
      prismaMock.user.findUnique.mockResolvedValue(user);
      await expect(service.findOneById(1)).resolves.toBe(user);
      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({ where: { id: 1 } });
    });

    it('throws InternalServerErrorException on prisma error', async () => {
      prismaMock.user.findUnique.mockRejectedValue(new Error('db fail'));
      await expect(service.findOneById(1)).rejects.toBeInstanceOf(InternalServerErrorException);
    });
  });

  describe('findOneBy', () => {
    it('returns the user when found by email', async () => {
      const user = { id: 2, email: 'x@y.com' };
      prismaMock.user.findUnique.mockResolvedValue(user);
      await expect(service.findOneBy('x@y.com')).resolves.toBe(user);
      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({ where: { email: 'x@y.com' } });
    });

    it('throws InternalServerErrorException on prisma error', async () => {
      prismaMock.user.findUnique.mockRejectedValue(new Error('db err'));
      await expect(service.findOneBy('e')).rejects.toBeInstanceOf(InternalServerErrorException);
    });
  });

  describe('create', () => {
    const payload = { email: 'u@u.com', password: 'plain' };

    it('hashes password and upserts user', async () => {
      (jest.spyOn(bcrypt, 'genSalt') as jest.Mock).mockResolvedValue('salt');
      (jest.spyOn(bcrypt, 'hash') as jest.Mock).mockResolvedValue('hashed');

      const created = { id: 3, email: 'u@u.com', password: 'hashed' };
      prismaMock.user.upsert.mockResolvedValue(created);

      const result = await service.create({ ...payload });
      expect(bcrypt.genSalt).toHaveBeenCalled();
      expect(bcrypt.hash).toHaveBeenCalledWith('plain', 'salt');
      expect(prismaMock.user.upsert).toHaveBeenCalledWith({
        where: { email: 'u@u.com' },
        update: { password: 'hashed' },
        create: { email: 'u@u.com', password: 'hashed' },
      });
      expect(result).toBe(created);
    });

    it('throws ConflictException on unique constraint violation', async () => {
      const err: any = new Error('dup');
      err.code = 'P2002';
      prismaMock.user.upsert.mockRejectedValue(err);
      await expect(service.create({ ...payload })).rejects.toBeInstanceOf(ConflictException);
    });

    it('throws InternalServerErrorException on other errors', async () => {
      prismaMock.user.upsert.mockRejectedValue(new Error('oops'));
      await expect(service.create({ ...payload })).rejects.toBeInstanceOf(InternalServerErrorException);
    });
  });

  describe('findOneByUserName', () => {
    it('returns user when found', async () => {
      const user = { githubUsername: 'gh', id: 4 };
      prismaMock.user.findUnique.mockResolvedValue(user);
      await expect(service.findOneByUserName('gh')).resolves.toBe(user);
      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: { githubUsername: 'gh' },
      });
    });

    it('throws InternalServerErrorException when user not found', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);
      await expect(service.findOneByUserName('nope')).rejects.toBeInstanceOf(InternalServerErrorException);
    });

    it('throws InternalServerErrorException on prisma error', async () => {
      prismaMock.user.findUnique.mockRejectedValue(new Error('fail'));
      await expect(service.findOneByUserName('err')).rejects.toBeInstanceOf(InternalServerErrorException);
    });
  });

  describe('updateByEmail', () => {
    it('updates and returns user', async () => {
      const updated = { id: 5, email: 'e@e.com', name: 'new' } as any;
      prismaMock.user.update.mockResolvedValue(updated);
      await expect(service.updateByEmail('e@e.com', { name: 'new' })).resolves.toBe(updated);
      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: { email: 'e@e.com' },
        data: { name: 'new' },
      });
    });

    it('throws InternalServerErrorException on error', async () => {
      prismaMock.user.update.mockRejectedValue(new Error('err'));
      await expect(service.updateByEmail('x', {})).rejects.toBeInstanceOf(InternalServerErrorException);
    });
  });
});
