import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { GoogleOAuthGuard } from './google-auth/google-oauth.guard';
import { GoogleService } from './google-auth/google.service';
import { Public } from '../auth/public-strategy';
import { GithubOAuthGuard } from './github-auth/github-oauth.guard';
import { GithubService } from './github-auth/github.service';

@Controller('oauth')
export class OauthController {
  constructor(
    private googleService: GoogleService,
    private githubService: GithubService,
  ) {}
  @Public()
  @Get('google')
  @UseGuards(GoogleOAuthGuard)
  async googleAuth(@Req() req) {}

  @Public()
  @Get('google-redirect')
  @UseGuards(GoogleOAuthGuard)
  async googleAuthRedirect(@Req() req, @Res() res: Response) {
    const payload = await this.googleService.googleLogin(req);
    if (!payload) {
      return res.redirect(`${process.env.FRONT_END_URL}/login-failure`);
    }
    return res.redirect(
      `${process.env.FRONT_END_URL}/login-success?token=${payload.access_token}`,
    );
  }

  @Public()
  @Get('github')
  @UseGuards(GithubOAuthGuard)
  async githubAuth(@Req() req) {}

  @Public()
  @Get('github-redirect')
  @UseGuards(GithubOAuthGuard)
  async githubAuthRedirect(@Req() req, @Res() res: Response) {
    const payload = await this.githubService.githubLogin(req);
    if (!payload) {
      return res.redirect(`${process.env.FRONT_END_URL}/login-failure`);
    }
    return res.redirect(
      `${process.env.FRONT_END_URL}/login-success?token=${payload.access_token}&username=${payload.username}`,
    );
  }
}
