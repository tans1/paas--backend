import { Test, TestingModule } from '@nestjs/testing';
import { OctokitService } from './octokit.service';
import { UsersService } from '../../users/users.service';
import { Octokit } from '@octokit/rest';
import { NotFoundException, BadRequestException } from '@nestjs/common';

// Create a mock Octokit class
class MockOctokit {
  constructor(options: { auth: string }) {
    this.auth = options.auth;
  }
  auth: string;
}

// Mock the dynamic import of Octokit
jest.mock('@octokit/rest', () => ({
  Octokit: jest.fn().mockImplementation((options) => new MockOctokit(options)),
}));

describe('OctokitService', () => {
  let service: OctokitService;
  let usersService: UsersService;

  const mockUser = {
    email: 'test@example.com',
    githubAccessToken: 'mock-github-token',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OctokitService,
        {
          provide: UsersService,
          useValue: {
            findOneBy: jest.fn().mockResolvedValue(mockUser),
          },
        },
      ],
    }).compile();

    service = module.get<OctokitService>(OctokitService);
    usersService = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getOctokit', () => {
    it('should create and return an Octokit instance with the correct auth token', async () => {
      // Act
      const result = await service.getOctokit(mockUser.email);

      // Assert
      expect(usersService.findOneBy).toHaveBeenCalledWith(mockUser.email);
      expect(Octokit).toHaveBeenCalledWith({ auth: mockUser.githubAccessToken });
      expect(result).toBeInstanceOf(MockOctokit);
    });

    it('should throw NotFoundException if user is not found', async () => {
      // Arrange
      jest.spyOn(usersService, 'findOneBy').mockResolvedValueOnce(null);

      // Act & Assert
      await expect(service.getOctokit('nonexistent@example.com')).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if githubAccessToken is not available', async () => {
      // Arrange
      jest.spyOn(usersService, 'findOneBy').mockResolvedValueOnce({
        ...mockUser,
        githubAccessToken: null,
      });

      // Act & Assert
      await expect(service.getOctokit(mockUser.email)).rejects.toThrow(BadRequestException);
    });
  });
});