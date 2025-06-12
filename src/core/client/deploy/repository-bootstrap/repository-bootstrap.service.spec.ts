import { Test, TestingModule } from '@nestjs/testing';
import { RepositoryBootstrapService } from './repository-bootstrap.service';
import * as git from 'isomorphic-git';
import * as fs from 'fs';
import * as path from 'path';
import http from 'isomorphic-git/http/node';

// Mock the dependencies
jest.mock('fs');
jest.mock('isomorphic-git');

describe('RepositoryBootstrapService', () => {
  let service: RepositoryBootstrapService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RepositoryBootstrapService],
    }).compile();

    service = module.get<RepositoryBootstrapService>(RepositoryBootstrapService);

    // Reset mocks before each test
    // jest.clearAllMocks();
  });

  describe('bootstrapRepository', () => {
    const cloneUrl = 'https://github.com/user/repo.git';
    const localRepoPath = '/path/to/repo';
    const branch = 'main';
    const githubAccessToken = 'ghp_token123';

    it('should create directory if it does not exist and clone the repository successfully', async () => {
      // Mock fs.existsSync to return false (directory does not exist)
      (fs.existsSync as jest.Mock).mockReturnValue(false);
      // Mock fs.mkdirSync to simulate directory creation
      (fs.mkdirSync as jest.Mock).mockImplementation(() => {});
      // Mock git.clone to resolve successfully
      (git.clone as jest.Mock).mockResolvedValue(undefined);

      await expect(
        service.bootstrapRepository(cloneUrl, localRepoPath, branch, githubAccessToken),
      ).resolves.toBeUndefined();

      // Verify directory creation
      expect(fs.existsSync).toHaveBeenCalledWith(localRepoPath);
      expect(fs.mkdirSync).toHaveBeenCalledWith(localRepoPath, { recursive: true });

      // Verify git.clone was called with correct parameters
      expect(git.clone).toHaveBeenCalledWith({
        fs,
        http,
        dir: localRepoPath,
        url: cloneUrl,
        singleBranch: true,
        ref: branch,
        depth: 1,
        onAuth: expect.any(Function),
      });

      // Test the onAuth function
      const onAuth = (git.clone as jest.Mock).mock.calls[0][0].onAuth;
      expect(onAuth()).toEqual({ username: 'oauth2', password: githubAccessToken });
    });

    it('should skip directory creation if it already exists and clone the repository', async () => {
      // Mock fs.existsSync to return true (directory exists)
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      // Mock git.clone to resolve successfully
      (git.clone as jest.Mock).mockResolvedValue(undefined);

      await expect(
        service.bootstrapRepository(cloneUrl, localRepoPath, branch, githubAccessToken),
      ).resolves.toBeUndefined();

      // Verify directory was checked but not created
      expect(fs.existsSync).toHaveBeenCalledWith(localRepoPath);
      expect(fs.mkdirSync).not.toHaveBeenCalled();

      // Verify git.clone was called
      expect(git.clone).toHaveBeenCalledWith(expect.any(Object));
    });

    it('should throw an error if cloning the repository fails', async () => {
      // Mock fs.existsSync to return false
      (fs.existsSync as jest.Mock).mockReturnValue(false);
      // Mock fs.mkdirSync
      (fs.mkdirSync as jest.Mock).mockImplementation(() => {});
      // Mock git.clone to throw an error
      const errorMessage = 'Clone failed';
      (git.clone as jest.Mock).mockRejectedValue(new Error(errorMessage));

      await expect(
        service.bootstrapRepository(cloneUrl, localRepoPath, branch, githubAccessToken),
      ).rejects.toThrow(`Failed to clone repository: ${errorMessage}`);

      // Verify directory creation was attempted
      expect(fs.existsSync).toHaveBeenCalledWith(localRepoPath);
      expect(fs.mkdirSync).toHaveBeenCalledWith(localRepoPath, { recursive: true });

      // Verify git.clone was called
      expect(git.clone).toHaveBeenCalledWith(expect.any(Object));
    });
  });
});