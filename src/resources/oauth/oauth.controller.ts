import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { GoogleOAuthGuard } from './google-auth/google-oauth.guard';
import { GoogleService } from './google-auth/google.service';
import { Public } from '../auth/public-strategy';
import { GithubOAuthGuard } from './github-auth/github-oauth.guard';
import { GithubService } from './github-auth/github.service';

@Controller('oauth')
export class OauthController {
    constructor(private googleService : GoogleService
        ,private githubService : GithubService
    ){}
    @Public()
    @Get('google')
    @UseGuards(GoogleOAuthGuard)
    async googleAuth(@Req() req) {}

    @Public()
    @Get('google-redirect')
    @UseGuards(GoogleOAuthGuard)
    googleAuthRedirect(@Req() req) {
      return this.googleService.googleLogin(req);
    }

    @Public()
    @Get('github')
    @UseGuards(GithubOAuthGuard)
    async githubAuth(@Req() req) {}
    
    @Public()
    @Get('github-redirect')
    @UseGuards(GithubOAuthGuard)
    githubAuthRedirect(@Req() req) {
      return this.githubService.githubLogin(req);
    }
}
