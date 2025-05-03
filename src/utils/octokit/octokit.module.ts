import { Module } from '@nestjs/common';
import { OctokitService } from './octokit.service';
import { GitHubFileService } from './github-services/github-file.service';
import { UsersModule } from '@/resources/users/users.module';

@Module({
    imports:[UsersModule],
    providers: [OctokitService,GitHubFileService], 
    exports: [OctokitService,GitHubFileService]})
export class OctoktModule {}
