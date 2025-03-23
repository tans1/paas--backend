import { Test, TestingModule } from '@nestjs/testing';
import { AuthGuard } from './auth.guard';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import { UnauthorizedException, ExecutionContext } from '@nestjs/common';
import { jwtConstants } from '../../constants';
import { IS_PUBLIC_KEY } from '../../public-strategy';
import { Request } from 'express';

describe('AuthGuard', () => {
  let authGuard: AuthGuard;
  let jwtService: JwtService;
  let reflector: Reflector;

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
    jwtService = module.get<JwtService>(JwtService);
    reflector = module.get<Reflector>(Reflector);
  });

  it('should be defined', () => {
    expect(authGuard).toBeDefined();
  });

  describe('canActivate', () => {
    let context: ExecutionContext;
    let request: Partial<Request>;

    beforeEach(() => {
      request = {
        headers: {},
      };

      context = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue(request),
        }),
        getHandler: jest.fn(),
        getClass: jest.fn(),
      } as unknown as ExecutionContext;
    });

    it('should allow access if route is public', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);

      const result = await authGuard.canActivate(context);

      expect(result).toBe(true);
      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(IS_PUBLIC_KEY, [
        context.getHandler(),
        context.getClass(),
      ]);
    });

    it('should throw UnauthorizedException if no token is provided', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);

      await expect(authGuard.canActivate(context)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if token validation fails', async () => {
      request.headers.authorization = 'Bearer invalid-token';
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
      jest.spyOn(jwtService, 'verifyAsync').mockRejectedValue(new Error('Invalid token'));

      await expect(authGuard.canActivate(context)).rejects.toThrow(UnauthorizedException);
    });

    it('should allow access and set user if token is valid', async () => {
      const payload = { sub: 'user-id', email: 'user@example.com' };
      request.headers.authorization = 'Bearer valid-token';
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
      jest.spyOn(jwtService, 'verifyAsync').mockResolvedValue(payload);

      const result = await authGuard.canActivate(context);

      expect(result).toBe(true);
      expect(jwtService.verifyAsync).toHaveBeenCalledWith('valid-token', { secret: jwtConstants.secret });
      expect(request['user']).toEqual(payload);
    });
  });

  describe('extractTokenFromHeader', () => {
    it('should extract token from authorization header', () => {
      const request = {
        headers: {
          authorization: 'Bearer valid-token',
        },
      } as Request;

      const token = authGuard['extractTokenFromHeader'](request);

      expect(token).toBe('valid-token');
    });

    it('should return undefined if authorization header is missing', () => {
      const request = {
        headers: {},
      } as Request;

      const token = authGuard['extractTokenFromHeader'](request);

      expect(token).toBeUndefined();
    });

    it('should return undefined if authorization header is not a Bearer token', () => {
      const request = {
        headers: {
          authorization: 'Basic some-token',
        },
      } as Request;

      const token = authGuard['extractTokenFromHeader'](request);

      expect(token).toBeUndefined();
    });
  });
});