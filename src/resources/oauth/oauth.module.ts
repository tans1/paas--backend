import { Module } from '@nestjs/common';
import { OauthController } from './oauth.controller';
import { GoogleService } from './google/google.service';
import { GithubService } from './github/github.service';

@Module({
  controllers: [OauthController],
  providers: [GoogleService, GithubService]
})
export class OauthModule {}
