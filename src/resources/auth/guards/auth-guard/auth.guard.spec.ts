import { Test, TestingModule } from '@nestjs/testing';
import { AuthGuard } from './auth.guard';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import { UnauthorizedException } from '@nestjs/common';
import { jwtConstants } from '../../constants';
import { ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

// Mock the ExecutionContext and Request
const mockRequest = (headers: any = {}): Partial<Request> => ({
  headers,
});

const mockExecutionContext = (request: Partial<Request>, isPublic = false): ExecutionContext => ({
  switchToHttp: () => ({
    getRequest: () => request as any,
    getResponse: () => ({} as any),
    getNext: () => ({} as any),
  }),
  getHandler: () => function() {},
  getClass: () => class {} as any,
  getArgs: () => [] as any,
  getArgByIndex: () => ({} as any),
  switchToRpc: () => ({} as any),
  switchToWs: () => ({} as any),
  getType: () => 'http' as any,
});

describe('AuthGuard', () => {
  let authGuard: AuthGuard;
  let jwtService: jest.Mocked<JwtService>;
  let reflector: jest.Mocked<Reflector>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthGuard,
        {
          provide: JwtService,
          useValue: {
            verifyAsync: jest.fn(),
          },
        },
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: jest.fn(),
          },
        },
      ],
    }).compile();

    authGuard = module.get<AuthGuard>(AuthGuard);
    jwtService = module.get(JwtService) as jest.Mocked<JwtService>;
    reflector = module.get(Reflector) as jest.Mocked<Reflector>;

    jest.clearAllMocks();
  });

  describe('canActivate', () => {
    it('should allow access for public routes', async () => {
      reflector.getAllAndOverride.mockReturnValue(true);
      const context = mockExecutionContext(mockRequest());

      const result = await authGuard.canActivate(context);

      expect(result).toBe(true);
      expect(reflector.getAllAndOverride).toHaveBeenCalledWith('isPublic', [
        context.getHandler(),
        context.getClass(),
      ]);
      expect(jwtService.verifyAsync).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException if no token is provided', async () => {
      reflector.getAllAndOverride.mockReturnValue(false);
      const request = mockRequest({ authorization: '' });
      const context = mockExecutionContext(request);

      await expect(authGuard.canActivate(context)).rejects.toThrow(UnauthorizedException);
      expect(jwtService.verifyAsync).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException if token is not Bearer', async () => {
      reflector.getAllAndOverride.mockReturnValue(false);
      const request = mockRequest({ authorization: 'Basic token123' });
      const context = mockExecutionContext(request);

      await expect(authGuard.canActivate(context)).rejects.toThrow(UnauthorizedException);
      expect(jwtService.verifyAsync).not.toHaveBeenCalled();
    });

    it('should verify token and attach payload to request for valid Bearer token', async () => {
      reflector.getAllAndOverride.mockReturnValue(false);
      const request = mockRequest({ authorization: 'Bearer token123' });
      const context = mockExecutionContext(request);
      const payload = { sub: 'user123', email: 'test@example.com' };
      jwtService.verifyAsync.mockResolvedValue(payload);

      const result = await authGuard.canActivate(context);

      expect(result).toBe(true);
      expect(jwtService.verifyAsync).toHaveBeenCalledWith('token123', {
        secret: jwtConstants.secret,
      });
      expect(request['user']).toEqual(payload);
    });

    it('should throw UnauthorizedException for invalid token', async () => {
      reflector.getAllAndOverride.mockReturnValue(false);
      const request = mockRequest({ authorization: 'Bearer invalidToken' });
      const context = mockExecutionContext(request);
      jwtService.verifyAsync.mockRejectedValue(new Error('Invalid token'));

      await expect(authGuard.canActivate(context)).rejects.toThrow(UnauthorizedException);
      expect(jwtService.verifyAsync).toHaveBeenCalledWith('invalidToken', {
        secret: jwtConstants.secret,
      });
    });
  });

  describe('extractTokenFromHeader', () => {
    it('should extract Bearer token from header', () => {
      const request = mockRequest({ authorization: 'Bearer token123' });
      const token = (authGuard as any).extractTokenFromHeader(request);
      expect(token).toBe('token123');
    });

    it('should return undefined for non-Bearer token', () => {
      const request = mockRequest({ authorization: 'Basic token123' });
      const token = (authGuard as any).extractTokenFromHeader(request);
      expect(token).toBeUndefined();
    });

    it('should return undefined if authorization header is missing', () => {
      const request = mockRequest({});
      const token = (authGuard as any).extractTokenFromHeader(request);
      expect(token).toBeUndefined();
    });
  });
});