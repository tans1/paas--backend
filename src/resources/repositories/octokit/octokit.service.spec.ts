import { Test, TestingModule } from '@nestjs/testing';
import { OctokitService } from './octokit.service';
import { UsersService } from '../../users/users.service';

describe('OctokitService', () => {
  let service: OctokitService;
  let usersService: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OctokitService,
        {
          provide: UsersService,
          useValue: {
            findOneBy: jest.fn(),
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
    it('should return a new instance of Octokit with the provided auth token', async () => {
      const email = 'test@example.com';
      const user = { githubAccessToken: 'mockAccessToken' };

      jest.spyOn(usersService, 'findOneBy').mockResolvedValue(user);

      jest.mock('@octokit/rest', () => {
        return {
          Octokit: jest.fn().mockImplementation(() => {
            return {
              auth: 'mockAccessToken',
            };
          }),
        };
      });

      const result = await service.getOctokit(email);

      expect(usersService.findOneBy).toHaveBeenCalledWith(email);
      expect(result.auth).toEqual('mockAccessToken');
    });

    it('should handle errors when fetching user or creating Octokit instance', async () => {
      const email = 'test@example.com';
      const errorMessage = 'Error fetching user';

      jest.spyOn(usersService, 'findOneBy').mockRejectedValue(new Error(errorMessage));

      await expect(service.getOctokit(email)).rejects.toThrow(Error);
      await expect(service.getOctokit(email)).rejects.toThrow(errorMessage);
    });
  });
});