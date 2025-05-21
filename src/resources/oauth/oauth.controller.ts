import { Controller, Get, Logger, Query, Req, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { GoogleOAuthGuard } from './google-auth/google-oauth.guard';
import { GoogleService } from './google-auth/google.service';
import { Public } from '../auth/public-strategy';
import { GithubOAuthGuard } from './github-auth/github-oauth.guard';
import { GithubService } from './github-auth/github.service';
import { ConnectService } from '../repositories/connect/connect.service';
import { RedirectStrategyService } from '../../utils/redirect-strategy/RedirectStrategyService';

@Controller('oauth')
export class OauthController {
  private logger = new Logger(OauthController.name)
  constructor(
    private googleService: GoogleService,
    private githubService: GithubService,
    private connectService: ConnectService,
  ) {}
  @Public()
  @Get('google')
  @UseGuards(GoogleOAuthGuard)
  async googleAuth(@Req() req) {}

  @Public()
  @Get('google-redirect')
  @UseGuards(GoogleOAuthGuard)
  async googleAuthRedirect(@Req() req, @Res() res: Response) {

    try{

      const payload = await this.googleService.googleLogin(req);
      if (!payload) {
        return RedirectStrategyService.redirectToFailure(res);
      }
      return RedirectStrategyService.redirectToSuccess(res,payload);

    }
    catch(error){
      this.logger.error('Authentication Error:', error);
      
      const safeError = error instanceof Error
        ? error.message
        : 'Unknown authentication error';
    
        return RedirectStrategyService.redirectToFailure(res, safeError);

    }
  }

  @Public()
  @Get('github')
  @UseGuards(GithubOAuthGuard)
  async githubAuth(@Req() req) {}

  @Public()
  @Get('github-redirect')
  @UseGuards(GithubOAuthGuard)
  async githubAuthRedirect(
    @Req() req, 
    @Res() res: Response,
    @Query('state') state: string,
  ) {
    try {
      // Handle GitHub connection state if present
      try{

        if (state) {
          const connectionResult = await this.connectService.handleGitHubCallback(state, req.user);
          return RedirectStrategyService.redirectWithConnectionResult(res, connectionResult);
        }
      
      }
      catch(error){
        const safeError = error instanceof Error
        ? error.message
        : 'Unknown linking error';
    
        return RedirectStrategyService.redirectWithConnectionResult(
          res,
           {
            success : false,
            error : safeError
        });
      }
      // Regular GitHub authentication flow
      const payload = await this.githubService.githubLogin(req);
      
      if (!payload) {
        return RedirectStrategyService.redirectToFailure(res, 'GitHub authentication failed');
      }
    
      return RedirectStrategyService.redirectToSuccess(res, payload);
    } catch (error) {
      this.logger.error('Authentication Error:', error);
      
      const safeError = error instanceof Error
        ? error.message
        : 'Unknown authentication error';
    
        return RedirectStrategyService.redirectToFailure(res, safeError);
    }


    
  }
}
