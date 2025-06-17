import { Test, TestingModule } from '@nestjs/testing';
import { OauthController } from './oauth.controller';
import { GoogleService } from './google-auth/google.service';
import { GithubService } from './github-auth/github.service';
import { Response } from 'express';
import { UsersService } from '../users/users.service';
import { InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { ConnectService } from '../repositories/connect/connect.service';

describe('OauthController', () => {
  let controller: OauthController;
  let googleService: GoogleService;
  let githubService: GithubService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OauthController],
      providers: [ConnectService,
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
        {
          provide: UsersService,
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
          },
        },
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
    it('should handle google auth request', async () => {
      const req = {};
      await expect(controller.googleAuth(req)).resolves.toBeUndefined();
    });
  });

  describe('googleAuthRedirect', () => {
    it('should redirect to login-success with token on successful login', async () => {
      const req = {};
      const res = {
        redirect: jest.fn(),
      } as unknown as Response;
      const payload = { access_token: 'test-token' };
      jest.spyOn(googleService, 'googleLogin').mockResolvedValue(payload);

      await controller.googleAuthRedirect(req, res);

      expect(googleService.googleLogin).toHaveBeenCalledWith(req);
      expect(res.redirect).toHaveBeenCalledWith(
        `${process.env.FRONT_END_URL}/login-success?token=${payload.access_token}`,
      );
    });

    it('should redirect to login-failure on failed login', async () => {
      const req = {};
      const res = {
        redirect: jest.fn(),
      } as unknown as Response;
      jest.spyOn(googleService, 'googleLogin').mockResolvedValue(undefined);

      await controller.googleAuthRedirect(req, res);

      expect(googleService.googleLogin).toHaveBeenCalledWith(req);
      expect(res.redirect).toHaveBeenCalledWith(
        `${process.env.FRONT_END_URL}/login-failure`,
      );
    });

    it('should handle NotFoundException from googleLogin', async () => {
      const req = {};
      const res = {
        redirect: jest.fn(),
      } as unknown as Response;
      jest.spyOn(googleService, 'googleLogin').mockRejectedValue(new NotFoundException());

      await controller.googleAuthRedirect(req, res);

      expect(googleService.googleLogin).toHaveBeenCalledWith(req);
      expect(res.redirect).toHaveBeenCalledWith(
        `${process.env.FRONT_END_URL}/login-failure`,
      );
    });

    it('should handle InternalServerErrorException from googleLogin', async () => {
      const req = {};
      const res = {
        redirect: jest.fn(),
      } as unknown as Response;
      jest.spyOn(googleService, 'googleLogin').mockRejectedValue(new InternalServerErrorException());

      await controller.googleAuthRedirect(req, res);

      expect(googleService.googleLogin).toHaveBeenCalledWith(req);
      expect(res.redirect).toHaveBeenCalledWith(
        `${process.env.FRONT_END_URL}/login-failure`,
      );
    });
  });

  describe('githubAuth', () => {
    it('should handle github auth request', async () => {
      const req = {};
      await expect(controller.githubAuth(req)).resolves.toBeUndefined();
    });
  });

  describe('githubAuthRedirect', () => {
    it('should redirect to login-success with token and username on successful login', async () => {
      const req = {};
      const res = {
        redirect: jest.fn(),
      } as unknown as Response;
      const payload = { access_token: 'test-token'};
      jest.spyOn(githubService, 'githubLogin').mockResolvedValue(payload);

      await controller.githubAuthRedirect(req, res, 'test-state');

      expect(githubService.githubLogin).toHaveBeenCalledWith(req);
      expect(res.redirect).toHaveBeenCalledWith(
        `${process.env.FRONT_END_URL}/login-success?token=${payload.access_token}`,
      );
    });

    it('should redirect to login-failure on failed login', async () => {
      const req = {};
      const res = {
        redirect: jest.fn(),
      } as unknown as Response;
      jest.spyOn(githubService, 'githubLogin').mockResolvedValue(undefined);

      await controller.githubAuthRedirect(req, res, 'test-state');

      expect(githubService.githubLogin).toHaveBeenCalledWith(req);
      expect(res.redirect).toHaveBeenCalledWith(
        `${process.env.FRONT_END_URL}/login-failure`,
      );
    });

    it('should handle NotFoundException from githubLogin', async () => {
      const req = {};
      const res = {
        redirect: jest.fn(),
      } as unknown as Response;
      jest.spyOn(githubService, 'githubLogin').mockRejectedValue(new NotFoundException());

      await controller.githubAuthRedirect(req, res, 'test-state');

      expect(githubService.githubLogin).toHaveBeenCalledWith(req);
      expect(res.redirect).toHaveBeenCalledWith(
        `${process.env.FRONT_END_URL}/login-failure`,
      );
    });

    it('should handle InternalServerErrorException from githubLogin', async () => {
      const req = {};
      const res = {
        redirect: jest.fn(),
      } as unknown as Response;
      jest.spyOn(githubService, 'githubLogin').mockRejectedValue(new InternalServerErrorException());

      await controller.githubAuthRedirect(req, res, 'test-state');

      expect(githubService.githubLogin).toHaveBeenCalledWith(req);
      expect(res.redirect).toHaveBeenCalledWith(
        `${process.env.FRONT_END_URL}/login-failure`,
      );
    });
  });
});