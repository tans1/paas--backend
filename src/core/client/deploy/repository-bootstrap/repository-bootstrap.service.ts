import { Injectable } from '@nestjs/common';
import * as git from 'isomorphic-git';
import * as fs from 'fs';
import * as path from 'path';
import http from 'isomorphic-git/http/node';

@Injectable()
export class RepositoryBootstrapService {
    constructor() {}
    // TODO : Make it specif for a branch that the user wants to clone
    async bootstrapRepository(cloneUrl: string, localRepoPath: string) {
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
            });

            console.log('Repository cloned successfully!');
        } catch (error) {
            console.error('Error cloning repository:', error);
            throw new Error(`Failed to clone repository: ${error.message}`);
        }
    }
}
