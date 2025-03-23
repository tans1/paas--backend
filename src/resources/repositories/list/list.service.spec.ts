import { Test, TestingModule } from '@nestjs/testing';
import { ListService } from './list.service';
import { OctokitService } from '../octokit/octokit.service';

describe('ListService', () => {
  let service: ListService;
  let octokitService: OctokitService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ListService,
        {
          provide: OctokitService,
          useValue: {
            getOctokit: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ListService>(ListService);
    octokitService = module.get<OctokitService>(OctokitService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getRepoInfo', () => {
    it('should return repository info', async () => {
      const email = 'test@example.com';
      const owner = 'testowner';
      const repo = 'testrepo';
      const mockRepoData = { name: 'testrepo', owner: { login: 'testowner' } };
      const octokitInstance = {
        repos: {
          get: jest.fn().mockResolvedValue({ data: mockRepoData }),
        },
      };

      jest.spyOn(octokitService, 'getOctokit').mockResolvedValue(octokitInstance as any);

      const result = await service.getRepoInfo(email, owner, repo);

      expect(octokitService.getOctokit).toHaveBeenCalledWith(email);
      expect(octokitInstance.repos.get).toHaveBeenCalledWith({ owner, repo });
      expect(result).toEqual({
        message: 'Successfully fetched repository info',
        data: mockRepoData,
      });
    });

    it('should handle errors when fetching repository info', async () => {
      const email = 'test@example.com';
      const owner = 'testowner';
      const repo = 'testrepo';
      const errorMessage = 'Error fetching repository info';

      const octokitInstance = {
        repos: {
          get: jest.fn().mockRejectedValue(new Error(errorMessage)),
        },
      };

      jest.spyOn(octokitService, 'getOctokit').mockResolvedValue(octokitInstance as any);

      await expect(service.getRepoInfo(email, owner, repo)).rejects.toThrow(Error);
      await expect(service.getRepoInfo(email, owner, repo)).rejects.toThrow(errorMessage);
    });
  });

  describe('getAllUserRepos', () => {
    it('should return user repositories', async () => {
      const email = 'test@example.com';
      const mockReposData = [{ name: 'repo1' }, { name: 'repo2' }];
      const octokitInstance = {
        repos: {
          listForAuthenticatedUser: jest.fn().mockResolvedValue({ data: mockReposData }),
        },
      };

      jest.spyOn(octokitService, 'getOctokit').mockResolvedValue(octokitInstance as any);

      const result = await service.getAllUserRepos(email);

      expect(octokitService.getOctokit).toHaveBeenCalledWith(email);
      expect(octokitInstance.repos.listForAuthenticatedUser).toHaveBeenCalledWith({
        per_page: 100,
      });
      expect(result).toEqual({
        message: 'Successfully fetched user repositories',
        data: mockReposData,
      });
    });

    it('should handle errors when fetching user repositories', async () => {
      const email = 'test@example.com';
      const errorMessage = 'Error fetching user repositories';

      const octokitInstance = {
        repos: {
          listForAuthenticatedUser: jest.fn().mockRejectedValue(new Error(errorMessage)),
        },
      };

      jest.spyOn(octokitService, 'getOctokit').mockResolvedValue(octokitInstance as any);

      await expect(service.getAllUserRepos(email)).rejects.toThrow(Error);
      await expect(service.getAllUserRepos(email)).rejects.toThrow(errorMessage);
    });
  });
});