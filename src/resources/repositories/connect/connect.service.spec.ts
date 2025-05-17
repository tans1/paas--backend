import { Test, TestingModule } from '@nestjs/testing';
import { ConnectService } from './connect.service';
import { UsersService } from '../../users/users.service';
import axios from 'axios';
import { CallBackFailedException, TokenNotFoundException } from '../../../utils/exceptions/github.exception';

// Mock the UsersService
jest.mock('../../users/users.service', () => ({
  UsersService: jest.fn().mockImplementation(() => ({
    updateByEmail: jest.fn(),
  })),
}));

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('ConnectService', () => {
  let service: ConnectService;
  let usersService: UsersService;

  const createMockAxiosResponse = (data: any) => ({
    data,
    status: 200,
    statusText: 'OK',
    headers: {},
    config: {} as any,
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConnectService,
        UsersService,
      ],
    }).compile();

    service = module.get<ConnectService>(ConnectService);
    usersService = module.get<UsersService>(UsersService);

    // Set environment variables for tests
    process.env.DEP_GITHUB_CLIENT_ID = 'test-client-id';
    process.env.DEP_GITHUB_CLIENT_SECRET = 'test-client-secret';
    process.env.DEP_GITHUB_REDIRECT_URL = 'http://localhost/callback';
  });

  afterEach(() => {
    jest.clearAllMocks();
    // Clean up environment variables
    delete process.env.DEP_GITHUB_CLIENT_ID;
    delete process.env.DEP_GITHUB_CLIENT_SECRET;
    delete process.env.DEP_GITHUB_REDIRECT_URL;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('redirectToGitHubAuth', () => {
    it('should return correct GitHub authorization URL', () => {
      process.env.DEP_GITHUB_CLIENT_ID = 'test-client-id';
      process.env.DEP_GITHUB_REDIRECT_URL = 'http://localhost:3000/callback';

      const expectedUrl = 'https://github.com/login/oauth/authorize' +
        '?client_id=test-client-id' +
        '&redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fcallback' +
        '&scope=repo,user:email';

      const result = service.redirectToGitHubAuth();
      expect(result).toBe(expectedUrl);
    });
  });

  describe('handleGitHubCallback', () => {
    const mockCode = 'test-code';
    const mockAccessToken = 'test-access-token';
    const mockGithubUsername = 'testuser';
    const mockEmail = 'test@example.com';

    beforeEach(() => {
      process.env.DEP_GITHUB_CLIENT_ID = 'test-client-id';
      process.env.DEP_GITHUB_CLIENT_SECRET = 'test-client-secret';
    });

    it('should successfully handle GitHub callback and update user', async () => {
      // Mock token response
      mockedAxios.post.mockResolvedValueOnce(createMockAxiosResponse({
        access_token: mockAccessToken,
        token_type: 'bearer',
        scope: 'repo,user:email',
      }));

      // Mock user info response
      mockedAxios.get.mockResolvedValueOnce(createMockAxiosResponse({
        login: mockGithubUsername,
        id: 123,
        email: mockEmail,
      }));

      jest.spyOn(usersService, 'updateByEmail').mockResolvedValueOnce(undefined);

      const result = await service.handleGitHubCallback(mockCode);

      expect(result).toEqual({
        message: 'Successfully connected to GitHub',
        data: {
          githubUsername: mockGithubUsername,
        },
      });

      expect(usersService.updateByEmail).toHaveBeenCalledWith(mockEmail, {
        githubUsername: mockGithubUsername,
        githubAccessToken: mockAccessToken,
      });
    });

    it('should fetch email from emails endpoint if not provided in user info', async () => {
      // Mock token response
      mockedAxios.post.mockResolvedValueOnce(createMockAxiosResponse({
        access_token: mockAccessToken,
        token_type: 'bearer',
        scope: 'repo,user:email',
      }));

      // Mock user info response without email
      mockedAxios.get.mockResolvedValueOnce(createMockAxiosResponse({
        login: mockGithubUsername,
        id: 123,
      }));

      // Mock emails response
      mockedAxios.get.mockResolvedValueOnce(createMockAxiosResponse([
        {
          email: mockEmail,
          primary: true,
          verified: true,
          visibility: 'public',
        },
      ]));

      jest.spyOn(usersService, 'updateByEmail').mockResolvedValueOnce(undefined);

      const result = await service.handleGitHubCallback(mockCode);

      expect(result).toEqual({
        message: 'Successfully connected to GitHub',
        data: {
          githubUsername: mockGithubUsername,
        },
      });

      expect(usersService.updateByEmail).toHaveBeenCalledWith(mockEmail, {
        githubUsername: mockGithubUsername,
        githubAccessToken: mockAccessToken,
      });
    });

    it('should throw CallBackFailedException when access token is not received', async () => {
      mockedAxios.post.mockResolvedValueOnce(createMockAxiosResponse({
        token_type: 'bearer',
        scope: 'repo,user:email',
      }));

      await expect(service.handleGitHubCallback(mockCode)).rejects.toThrow(CallBackFailedException);
    });

    it('should throw CallBackFailedException when GitHub API call fails', async () => {
      mockedAxios.post.mockRejectedValueOnce(new Error('API Error'));

      await expect(service.handleGitHubCallback(mockCode)).rejects.toThrow(CallBackFailedException);
    });
  });
});