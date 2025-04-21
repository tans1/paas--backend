import { Injectable } from '@nestjs/common';
import * as git from 'isomorphic-git';
import * as fs from 'fs';
import * as http from 'isomorphic-git/http/node';

// TODO: Some uniform linting rule for the entire project
@Injectable()
export class RepositorySyncService {
    async syncRepository(
        localRepoPath: string,
        userName: string, 
        userEmail: string,
        branch: string,
        githubAccessToken: string,
    ) {
        try {
            await git.pull({
                fs,
                http,
                dir: localRepoPath,
                singleBranch: true,
                author: { name: userName, email: userEmail },
                fastForwardOnly: true,
                ref: branch,
                onAuth: () => {
                    return { username: 'oauth2', password: githubAccessToken };
                }
            });
        } catch (error) {
            console.error('Sync failed:', error);
            throw new Error(`Sync failed: ${error.message}`);
        }
    }
}
