import { Test, TestingModule } from '@nestjs/testing';
import { OauthController } from './oauth.controller';
import { GoogleService } from './google-auth/google.service';
import { GithubService } from './github-auth/github.service';
import { GoogleOAuthGuard } from './google-auth/google-oauth.guard';
import { GithubOAuthGuard } from './github-auth/github-oauth.guard';
import { ExecutionContext, NotFoundException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Response } from 'express';

describe('OauthController', () => {
  let controller: OauthController;
  let googleService: GoogleService;
  let githubService: GithubService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OauthController],
      providers: [
        {
          provide: GoogleService,
          useValue: {
            googleLogin: jest.fn(),
          },
        },
        {
          provide: GithubService,
          useValue: {
            githubLogin: jest.fn(),
          },
        },
        Reflector,
      ],
    }).compile();

    controller = module.get<OauthController>(OauthController);
    googleService = module.get<GoogleService>(GoogleService);
    githubService = module.get<GithubService>(GithubService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('googleAuth', () => {
    it('should be defined', async () => {
      expect(controller.googleAuth).toBeDefined();
    });
  });

  describe('googleAuthRedirect', () => {
    it('should redirect to login-success with token on successful authentication', async () => {
      const req = { user: { email: 'test@example.com' } };
      const res: Response = {
        redirect: jest.fn(),
      } as any;
      const payload = { access_token: 'testtoken' };

      jest.spyOn(googleService, 'googleLogin').mockResolvedValue(payload);

      await controller.googleAuthRedirect(req, res);

      expect(googleService.googleLogin).toHaveBeenCalledWith(req);
      expect(res.redirect).toHaveBeenCalledWith(
        `${process.env.FRONT_END_URL}/login-success?token=${payload.access_token}`,
      );
    });

    it('should redirect to login-failure on failed authentication', async () => {
      const req = { user: { email: 'test@example.com' } };
      const res: Response = {
        redirect: jest.fn(),
      } as any;

      jest.spyOn(googleService, 'googleLogin').mockImplementation(() => {
        throw new NotFoundException('No user information provided in the request.');
      });

      await controller.googleAuthRedirect(req, res);

      expect(googleService.googleLogin).toHaveBeenCalledWith(req);
      expect(res.redirect).toHaveBeenCalledWith(
        `${process.env.FRONT_END_URL}/login-failure`,
      );
    });
  });

  describe('githubAuth', () => {
    it('should be defined', async () => {
      expect(controller.githubAuth).toBeDefined();
    });
  });

  describe('githubAuthRedirect', () => {
    it('should redirect to login-success with token and username on successful authentication', async () => {
      const req = { user: { email: 'test@example.com' } };
      const res: Response = {
        redirect: jest.fn(),
      } as any;
      const payload = { jwt_token: 'testtoken', username: 'testuser' };

      jest.spyOn(githubService, 'githubLogin').mockResolvedValue(payload);

      await controller.githubAuthRedirect(req, res);

      expect(githubService.githubLogin).toHaveBeenCalledWith(req);
      expect(res.redirect).toHaveBeenCalledWith(
        `${process.env.FRONT_END_URL}/login-success?token=${payload.jwt_token}&username=${payload.username}`,
      );
    });

    it('should redirect to login-failure on failed authentication', async () => {
      const req = { user: { email: 'test@example.com' } };
      const res: Response = {
        redirect: jest.fn(),
      } as any;

      jest.spyOn(githubService, 'githubLogin').mockImplementation(() => {
        throw new NotFoundException('No user data available in the request.');
      });

      await controller.githubAuthRedirect(req, res);

      expect(githubService.githubLogin).toHaveBeenCalledWith(req);
      expect(res.redirect).toHaveBeenCalledWith(
        `${process.env.FRONT_END_URL}/login-failure`,
      );
    });
  });
});