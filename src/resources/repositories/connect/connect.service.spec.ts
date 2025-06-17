import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, HttpStatus } from '@nestjs/common';
import axios from 'axios';
import { UsersService } from '../../users/users.service';
import { ConnectService } from './connect.service';
import {
  CallBackFailedException,
  TokenNotFoundException,
} from '../../../utils/exceptions/github.exception';
import * as crypto from 'crypto';

describe('ConnectService', () => {
  let connectService: ConnectService;
  let usersService: UsersService;
  let mockAxios: jest.Mocked<typeof axios>;

  beforeEach(async () => {
    mockAxios = {
      get: jest.fn(),
      post: jest.fn(),
      ...axios,
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConnectService,
        {
          provide: UsersService,
          useValue: {
            updateByEmail: jest.fn(),
          },
        },
        {
          provide: 'AXIOS_INSTANCE',
          useValue: mockAxios,
        },
      ],
    }).compile();

    connectService = module.get<ConnectService>(ConnectService);
    usersService = module.get<UsersService>(UsersService);
  });

  describe('redirectToGitHubAuth', () => {
    beforeEach(() => {
      process.env.STATE_SECRET = 'test-secret-key';
    });

    it('should generate correct GitHub auth URL', () => {
      const mockUser = { email: 'test@example.com' };
      const result = connectService.redirectToGitHubAuth(mockUser);
      
      expect(result).toContain('https://github.com/login/oauth/authorize');
      expect(result).toContain(`client_id=${process.env.GITHUB_CLIENT_ID}`);
      expect(result).toContain(`redirect_uri=${encodeURIComponent(process.env.GITHUB_CALLBACK_URL)}`);
      expect(result).toContain('&scope=repo,user:email');
    });
  });

  describe('handleGitHubCallback', () => {
    const mockState = 'base64.payload.signature';
    const mockGitHubUser = {
      username: 'testuser',
      accessToken: 123,
    };

    it('should successfully handle callback with valid state', async () => {
      jest.spyOn(connectService, 'verifyState').mockReturnValue({
        flow: 'connect',
        sub: { email: 'test@example.com' },
      });
      jest.spyOn(usersService, 'updateByEmail').mockResolvedValue(undefined);

      const result = await connectService.handleGitHubCallback(mockState, mockGitHubUser);
      expect(result).toEqual({ success: true });
    });

    it('should throw CallBackFailedException for invalid state', async () => {
      jest.spyOn(connectService, 'verifyState').mockImplementation(() => {
        throw new Error('Invalid state');
      });

      await expect(connectService.handleGitHubCallback(mockState, mockGitHubUser)
      ).rejects.toThrow(new HttpException('Callback failed', HttpStatus.BAD_REQUEST));
    });

    it('should throw TokenNotFoundException for missing accessToken', async () => {
      const userWithoutToken = { ...mockGitHubUser, accessToken: undefined };
      
      await expect(
        connectService.handleGitHubCallback(mockState, userWithoutToken)
      ).rejects.toThrow(new HttpException('Callback failed', HttpStatus.BAD_REQUEST));
    });

    it('should throw HttpException for invalid flow type', async () => {
      jest.spyOn(connectService, 'verifyState').mockReturnValue({
        flow: 'invalid',
        sub: { email: 'test@example.com' },
      });

      await expect(
        connectService.handleGitHubCallback(mockState, mockGitHubUser)
      ).rejects.toThrow(HttpException);
    });
  });

  describe('createState', () => {
    const mockPayload = { flow: 'connect', sub: { email: 'test@example.com' } };
    const mockSecret = 'test-secret-key';
    
    beforeEach(() => {
      process.env.STATE_SECRET = mockSecret;
    });

    it('should create valid state string with signature', () => {
      const result = connectService.createState(mockPayload);
      
      expect(result).toContain('.');
      const [base64, signature] = result.split('.');
      
      // Verify base64 part
      const decoded = Buffer.from(base64, 'base64').toString();
      expect(decoded).toContain(JSON.stringify(mockPayload));
      
      // Verify signature
      const expectedSig = crypto
        .createHmac('sha256', mockSecret)
        .update(Buffer.from(base64, 'base64').toString())
        .digest('hex');
      
      expect(signature).toBe(expectedSig);
    });

    it('should handle empty payload', () => {
      const result = connectService.createState({});
      expect(result).toContain('.');
    });

    it('should handle complex payload structure', () => {
      const complexPayload = {
        flow: 'connect',
        sub: {
          email: 'test@example.com',
          metadata: {
            timestamp: Date.now(),
            source: 'github'
          }
        }
      };
      
      const result = connectService.createState(complexPayload);
      expect(result).toContain('.');
      
      const [base64] = result.split('.');
      const decoded = Buffer.from(base64, 'base64').toString();
      expect(decoded).toContain(JSON.stringify(complexPayload));
    });

    it('should handle special characters in payload', () => {
      const payloadWithSpecialChars = {
        flow: 'connect',
        sub: {
          email: 'test+special@example.com',
          name: 'Test User!@#$%^&*()'
        }
      };
      
      const result = connectService.createState(payloadWithSpecialChars);
      expect(result).toContain('.');
      
      const [base64] = result.split('.');
      const decoded = Buffer.from(base64, 'base64').toString();
      expect(decoded).toContain(JSON.stringify(payloadWithSpecialChars));
    });
});
describe('missing STATE_SECRET', () => {
    let mockPayload = { flow: 'connect', sub: { email: 'test@example.com' } };
    beforeEach(() => {
      process.env.STATE_SECRET = '';
    });

    it('should throw error for missing STATE_SECRET', () => {
      delete process.env.STATE_SECRET;
      expect(() => connectService.createState(mockPayload)).toThrow(
        'The \"key\" argument must be of type string or an instance of ArrayBuffer, Buffer, TypedArray, DataView, KeyObject, or CryptoKey. Received undefined'
      );
    });
  });
});