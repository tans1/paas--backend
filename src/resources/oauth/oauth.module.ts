import { Module } from '@nestjs/common';
import { OauthController } from './oauth.controller';
import { GoogleService } from './google-auth/google.service';
import { GoogleStrategy } from './google-auth/google.strategy';
import { ConfigModule } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { GithubService } from './github-auth/github.service';
import { GithubStrategy } from './github-auth/github.strategy';

@Module({
  imports: [ConfigModule.forRoot(),PassportModule.register({})],
  controllers: [OauthController],
  providers: [GoogleService,GoogleStrategy,GithubService,GithubStrategy]
})
export class OauthModule {}
