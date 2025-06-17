import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { Request } from 'express';
import { AuthenticatedRequest } from '../../utils/types/user.types';
import { BaseUser } from './dto/base-user.dto';

describe('UsersController', () => {
  let controller: UsersController;
  let userService: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: {
            findOneBy: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    userService = module.get<UsersService>(UsersService);
  });

  describe('GET /user/profile', () => {
    it('should return user profile data', async () => {
      // Arrange
      const mockUser = {
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
      };
      const mockResponse = {
        ...mockUser,
        role: 'user',
      };

      (userService.findOneBy as jest.Mock).mockResolvedValue(mockResponse);

      const mockRequest = {
        user: mockUser,
      } as unknown as AuthenticatedRequest;

      // Act
      const result = await controller.profile(mockRequest);

      // Assert
      expect(result).toEqual(mockResponse);
      expect(userService.findOneBy).toHaveBeenCalledWith(mockUser.email);
      expect(userService.findOneBy).toHaveBeenCalledTimes(1);
    });

    it('should handle service errors gracefully', async () => {
      // Arrange
      const mockUser = {
        email: 'test@example.com',
      };
      const mockRequest = {
        user: mockUser,
      } as unknown as AuthenticatedRequest;

      (userService.findOneBy as jest.Mock).mockRejectedValue(new Error('Database error'));

      // Act and Assert
      await expect(controller.profile(mockRequest))
        .rejects
        .toThrow('Database error');
    });
  });
});