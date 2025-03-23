import { Test, TestingModule } from '@nestjs/testing';
import { ConnectService } from './connect.service';
import { UsersService } from '../../users/users.service';
import axios from 'axios';
import { CallBackFailedException, TokenNotFoundException } from '@/utils/exceptions/github.exception';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('ConnectService', () => {
  let service: ConnectService;
  let usersService: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConnectService,
        {
          provide: UsersService,
          useValue: {
            updateByEmail: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ConnectService>(ConnectService);
    usersService = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('redirectToGitHubAuth', () => {
    it('should return the GitHub Auth URL', () => {
      const url = service.redirectToGitHubAuth();
      expect(url).toContain('https://github.com/login/oauth/authorize');
    });
  });

  describe('handleGitHubCallback', () => {
    it('should throw TokenNotFoundException if no access token', async () => {
      mockedAxios.post.mockResolvedValueOnce({
        data: { access_token: null },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: { url: 'https://github.com/login/oauth/access_token' },
      });

      await expect(service.handleGitHubCallback('invalid_code')).rejects.toThrow(TokenNotFoundException);
    });

    it('should throw CallBackFailedException on callback failure', async () => {
      mockedAxios.post.mockRejectedValueOnce(new Error('Callback failed'));

      await expect(service.handleGitHubCallback('invalid_code')).rejects.toThrow(CallBackFailedException);
    });

    it('should return success message and data on successful callback', async () => {
      const mockAccessToken = 'mock_access_token';
      const mockGitHubUser = {
        login: 'mockuser',
        id: 1,
        email: 'mockuser@example.com',
      };
      const mockGitHubEmails = [
        { email: 'mockuser@example.com', primary: true, verified: true, visibility: null },
      ];

      mockedAxios.post.mockResolvedValueOnce({
        data: { access_token: mockAccessToken },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: { url: 'https://github.com/login/oauth/access_token' },
      });
      mockedAxios.get.mockResolvedValueOnce({
        data: mockGitHubUser,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: { url: 'https://api.github.com/user' },
      });
      mockedAxios.get.mockResolvedValueOnce({
        data: mockGitHubEmails,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: { url: 'https://api.github.com/user/emails' },
      });

      const result = await service.handleGitHubCallback('valid_code');
      expect(result).toEqual({
        message: 'Successfully connected to GitHub',
        data: {
          githubUsername: mockGitHubUser.login,
        },
      });
      expect(usersService.updateByEmail).toHaveBeenCalledWith('mockuser@example.com', {
        githubUsername: mockGitHubUser.login,
        githubAccessToken: mockAccessToken,
      });
    });
  });
});