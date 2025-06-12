import { Test, TestingModule } from '@nestjs/testing';
import { RepositorySyncService } from './repository-sync.service';
import * as git from 'isomorphic-git';
import * as fs from 'fs';
import * as http from 'isomorphic-git/http/node';

// Mock isomorphic-git
jest.mock('isomorphic-git', () => ({
  pull: jest.fn(),
}));

describe('RepositorySyncService', () => {
  let service: RepositorySyncService;

  beforeEach(async () => {
    // Mock console.error to suppress logs during tests
    jest.spyOn(console, 'error').mockImplementation(() => {});

    const module: TestingModule = await Test.createTestingModule({
      providers: [RepositorySyncService],
    }).compile();

    service = module.get<RepositorySyncService>(RepositorySyncService);
  });

  afterEach(() => {
    jest.clearAllMocks(); // Clear mocks, including console.error
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('syncRepository', () => {
    const mockParams = {
      localRepoPath: '/path/to/repo',
      userName: 'test-user',
      userEmail: 'test@example.com',
      branch: 'main',
      githubAccessToken: 'gh_token',
    };

    it('should successfully sync repository', async () => {
      // Mock git.pull to resolve successfully
      (git.pull as jest.Mock).mockResolvedValueOnce(undefined);

      await expect(
        service.syncRepository(
          mockParams.localRepoPath,
          mockParams.userName,
          mockParams.userEmail,
          mockParams.branch,
          mockParams.githubAccessToken,
        ),
      ).resolves.toBeUndefined();

      expect(git.pull).toHaveBeenCalledWith({
        fs,
        http,
        dir: mockParams.localRepoPath,
        singleBranch: true,
        author: { name: mockParams.userName, email: mockParams.userEmail },
        fastForwardOnly: true,
        ref: mockParams.branch,
        onAuth: expect.any(Function),
      });

      // Test onAuth callback
      const onAuth = (git.pull as jest.Mock).mock.calls[0][0].onAuth;
      expect(onAuth()).toEqual({
        username: 'oauth2',
        password: mockParams.githubAccessToken,
      });
    });

    it('should throw an error if sync fails', async () => {
      const errorMessage = 'Git pull failed';
      (git.pull as jest.Mock).mockRejectedValueOnce(new Error(errorMessage));

      await expect(
        service.syncRepository(
          mockParams.localRepoPath,
          mockParams.userName,
          mockParams.userEmail,
          mockParams.branch,
          mockParams.githubAccessToken,
        ),
      ).rejects.toThrow(`Sync failed: ${errorMessage}`);
    });

    it('should throw an error for invalid repository path', async () => {
      const invalidPath = '/invalid/path';
      (git.pull as jest.Mock).mockRejectedValueOnce(new Error('Repository not found'));

      await expect(
        service.syncRepository(
          invalidPath,
          mockParams.userName,
          mockParams.userEmail,
          mockParams.branch,
          mockParams.githubAccessToken,
        ),
      ).rejects.toThrow('Sync failed: Repository not found');
    });
  });
});