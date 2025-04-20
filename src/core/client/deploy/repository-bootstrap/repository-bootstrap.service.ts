import { Injectable } from '@nestjs/common';
import * as git from 'isomorphic-git';
import * as fs from 'fs';
import * as path from 'path';
import http from 'isomorphic-git/http/node';

@Injectable()
export class RepositoryBootstrapService {
    constructor() {}
    async bootstrapRepository(cloneUrl: string, localRepoPath: string,branch: string,githubAccessToken: string) {
        try {

            if (!fs.existsSync(localRepoPath)) {
                fs.mkdirSync(localRepoPath, { recursive: true });
            }

            await git.clone({
                fs,
                http,
                dir: localRepoPath,
                url: cloneUrl,
                singleBranch: true,
                ref: branch,
                depth: 1,
                onAuth: () => {
                    return { username: 'oauth2', password: githubAccessToken };
                }
            });

            console.log('Repository cloned successfully!');
        } catch (error) {
            console.error('Error cloning repository:', error);
            throw new Error(`Failed to clone repository: ${error.message}`);
        }
    }
}
