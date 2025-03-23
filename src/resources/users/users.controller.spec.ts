import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { Request } from 'express';
import { BaseUser } from './dto/base-user.dto';

describe('UsersController', () => {
  let controller: UsersController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('profile', () => {
    it('should return the user profile from request', () => {
      const mockUser: BaseUser = {
        id: '1', // Ensure `id` is a string
        email: 'testuser@example.com',
        password: 'securepassword'
    };

      // Properly type the request
      const mockRequest = { user: mockUser } as Partial<Request> as Request;
      const result = controller.profile(mockRequest);

      expect(result).toEqual(mockUser);
    });

    it('should return undefined if no user is in request', () => {
      const mockRequest = {} as Partial<Request> as Request;
      const result = controller.profile(mockRequest);

      expect(result).toBeUndefined();
    });
  });
});
