import { Test, TestingModule } from '@nestjs/testing';
import { ListService } from './list.service';
import { OctokitService } from '../octokit/octokit.service';

describe('ListService', () => {
  let service: ListService;
  let octokitService: OctokitService;

  // Mock Octokit instance
  const mockOctokit = {
    repos: {
      get: jest.fn(),
      listForAuthenticatedUser: jest.fn().mockName('listForAuthenticatedUser'),
      listBranches: jest.fn().mockName('listBranches'),
    },
    paginate: jest.fn(),
  };

  // Mock OctokitService to avoid real dependencies
  const mockOctokitService = {
    getOctokit: jest.fn().mockResolvedValue(mockOctokit),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ListService,
        {
          provide: OctokitService,
          useValue: mockOctokitService,
        },
      ],
    }).compile();

    service = module.get<ListService>(ListService);
    octokitService = module.get<OctokitService>(OctokitService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getRepoInfo', () => {
    it('should retrieve repository metadata correctly', async () => {
      // Arrange
      const testRepo = {
        name: 'test-repo',
        owner: { login: 'test-user' },
        private: false,
        html_url: 'https://github.com/test-user/test-repo',
      };
      mockOctokit.repos.get.mockResolvedValue({ data: testRepo });

      // Act
      const result = await service.getRepoInfo(
        'user@example.com',
        'test-user',
        'test-repo'
      );

      // Assert
      expect(octokitService.getOctokit).toHaveBeenCalledWith('user@example.com');
      expect(mockOctokit.repos.get).toHaveBeenCalledWith({
        owner: 'test-user',
        repo: 'test-repo',
      });
      expect(result).toEqual({
        message: 'Successfully fetched repository info',
        data: testRepo,
      });
    });

    it('should propagate API errors for repository info', async () => {
      // Arrange
      const errorMessage = 'Repository not found';
      mockOctokit.repos.get.mockRejectedValue(new Error(errorMessage));

      // Act & Assert
      await expect(
        service.getRepoInfo('user@example.com', 'test-user', 'nonexistent-repo')
      ).rejects.toThrow(errorMessage);
      expect(octokitService.getOctokit).toHaveBeenCalledWith('user@example.com');
      expect(mockOctokit.repos.get).toHaveBeenCalledWith({
        owner: 'test-user',
        repo: 'nonexistent-repo',
      });
    });
  });

  describe('getAllUserRepos', () => {
    it('should retrieve all user repositories with branches', async () => {
      // Arrange
      const mockRepos = [
        {
          name: 'repo1',
          owner: { login: 'test-user' },
          full_name: 'test-user/repo1',
        },
        {
          name: 'repo2',
          owner: { login: 'test-user' },
          full_name: 'test-user/repo2',
        },
      ];
      const mockBranches = [
        { name: 'main' },
        { name: 'develop' },
      ];

      mockOctokit.paginate
        .mockResolvedValueOnce(mockRepos) // For listForAuthenticatedUser
        .mockResolvedValueOnce(mockBranches) // For repo1 branches
        .mockResolvedValueOnce(mockBranches); // For repo2 branches

      // Act
      const result = await service.getAllUserRepos('user@example.com');

      // Assert
      expect(octokitService.getOctokit).toHaveBeenCalledWith('user@example.com');
      expect(mockOctokit.paginate).toHaveBeenCalledWith(
        mockOctokit.repos.listForAuthenticatedUser,
        { per_page: 100 }
      );
      expect(mockOctokit.paginate).toHaveBeenCalledWith(
        mockOctokit.repos.listBranches,
        {
          owner: 'test-user',
          repo: 'repo1',
          per_page: 100,
        }
      );
      expect(mockOctokit.paginate).toHaveBeenCalledWith(
        mockOctokit.repos.listBranches,
        {
          owner: 'test-user',
          repo: 'repo2',
          per_page: 100,
        }
      );
      expect(result).toEqual({
        message: 'Successfully fetched user repositories with branches',
        data: [
          {
            ...mockRepos[0],
            branches: ['main', 'develop'],
          },
          {
            ...mockRepos[1],
            branches: ['main', 'develop'],
          },
        ],
      });
    });

    it('should handle partial failure when fetching branches', async () => {
      // Arrange
      const mockRepos = [
        {
          name: 'repo1',
          owner: { login: 'test-user' },
          full_name: 'test-user/repo1',
        },
        {
          name: 'repo2',
          owner: { login: 'test-user' },
          full_name: 'test-user/repo2',
        },
      ];
      const mockBranches = [{ name: 'main' }];

      mockOctokit.paginate
        .mockResolvedValueOnce(mockRepos) // For listForAuthenticatedUser
        .mockResolvedValueOnce(mockBranches) // For repo1 branches
        .mockRejectedValueOnce(new Error('Permission denied')); // For repo2 branches

      // Act
      const result = await service.getAllUserRepos('user@example.com');

      // Assert
      expect(octokitService.getOctokit).toHaveBeenCalledWith('user@example.com');
      expect(mockOctokit.paginate).toHaveBeenCalledTimes(3);
      expect(result).toEqual({
        message: 'Successfully fetched user repositories with branches',
        data: [
          {
            ...mockRepos[0],
            branches: ['main'],
          },
          {
            ...mockRepos[1],
            branches: [],
            error: 'Failed to fetch branches',
          },
        ],
      });
    });

    it('should throw formatted error for failed repository listing', async () => {
      // Arrange
      const errorMessage = 'API rate limit exceeded';
      mockOctokit.paginate.mockRejectedValueOnce(new Error(errorMessage));

      // Act & Assert
      await expect(service.getAllUserRepos('user@example.com')).rejects.toThrow(
        `Failed to fetch user repositories: ${errorMessage}`
      );
      expect(octokitService.getOctokit).toHaveBeenCalledWith('user@example.com');
      expect(mockOctokit.paginate).toHaveBeenCalledWith(
        mockOctokit.repos.listForAuthenticatedUser,
        { per_page: 100 }
      );
    });

    it('should handle empty repository list', async () => {
      // Arrange
      mockOctokit.paginate.mockResolvedValueOnce([]); // No repositories

      // Act
      const result = await service.getAllUserRepos('user@example.com');

      // Assert
      expect(octokitService.getOctokit).toHaveBeenCalledWith('user@example.com');
      expect(mockOctokit.paginate).toHaveBeenCalledWith(
        mockOctokit.repos.listForAuthenticatedUser,
        { per_page: 100 }
      );
      expect(result).toEqual({
        message: 'Successfully fetched user repositories with branches',
        data: [],
      });
    });
  });
});