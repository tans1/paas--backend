import { Test, TestingModule } from '@nestjs/testing';
import { AuthGuard } from './auth.guard';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { jwtConstants } from '../../constants';
import { IS_PUBLIC_KEY } from '../../public-strategy';

describe('AuthGuard', () => {
  let authGuard: AuthGuard;
  let jwtService: JwtService;
  let reflector: Reflector;

  const mockJwtService = {
    verifyAsync: jest.fn(),
  };

  const mockReflector = {
    getAllAndOverride: jest.fn(),
  };

  const mockRequest = {
    headers: {
      authorization: '',
    },
  };

  const mockContext = {
    switchToHttp: jest.fn(() => ({
      getRequest: jest.fn(() => mockRequest),
    })),
    getHandler: jest.fn(),
    getClass: jest.fn(),
  } as unknown as ExecutionContext;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthGuard,
        { provide: JwtService, useValue: mockJwtService },
        { provide: Reflector, useValue: mockReflector },
      ],
    }).compile();

    authGuard = module.get<AuthGuard>(AuthGuard);
    jwtService = module.get<JwtService>(JwtService);
    reflector = module.get<Reflector>(Reflector);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('canActivate', () => {
    it('should return true if route is public', async () => {
      mockReflector.getAllAndOverride.mockReturnValue(true);

      const result = await authGuard.canActivate(mockContext);

      expect(result).toBe(true);
      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(IS_PUBLIC_KEY, [
        mockContext.getHandler(),
        mockContext.getClass(),
      ]);
      expect(mockJwtService.verifyAsync).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException if no token is provided', async () => {
      mockReflector.getAllAndOverride.mockReturnValue(false);
      mockRequest.headers.authorization = '';

      await expect(authGuard.canActivate(mockContext)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if token type is not Bearer', async () => {
      mockReflector.getAllAndOverride.mockReturnValue(false);
      mockRequest.headers.authorization = 'Basic some-token';

      await expect(authGuard.canActivate(mockContext)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if token verification fails', async () => {
      mockReflector.getAllAndOverride.mockReturnValue(false);
      mockRequest.headers.authorization = 'Bearer invalid-token';
      mockJwtService.verifyAsync.mockRejectedValue(new Error('Invalid token'));

      await expect(authGuard.canActivate(mockContext)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(mockJwtService.verifyAsync).toHaveBeenCalledWith('invalid-token', {
        secret: jwtConstants.secret,
      });
    });

    it('should attach user payload to request and return true if token is valid', async () => {
      mockReflector.getAllAndOverride.mockReturnValue(false);
      mockRequest.headers.authorization = 'Bearer valid-token';
      const payload = { sub: '123', username: 'testuser' };
      mockJwtService.verifyAsync.mockResolvedValue(payload);

      const result = await authGuard.canActivate(mockContext);

      expect(result).toBe(true);
      expect(mockJwtService.verifyAsync).toHaveBeenCalledWith('valid-token', {
        secret: jwtConstants.secret,
      });
      expect(mockRequest['user']).toEqual(payload);
    });
  });

  describe('extractTokenFromHeader', () => {
    it('should return undefined if authorization header is missing', () => {
      const request = { headers: {} };
      const token = (authGuard as any).extractTokenFromHeader(request);
      expect(token).toBeUndefined();
    });

    it('should return undefined if authorization header is malformed', () => {
      const request = { headers: { authorization: 'Invalid' } };
      const token = (authGuard as any).extractTokenFromHeader(request);
      expect(token).toBeUndefined();
    });

    it('should return token if authorization header is valid', () => {
      const request = { headers: { authorization: 'Bearer some-token' } };
      const token = (authGuard as any).extractTokenFromHeader(request);
      expect(token).toBe('some-token');
    });
  });
});

// Command to run the tests:
// npm run test auth.guard.spec.ts