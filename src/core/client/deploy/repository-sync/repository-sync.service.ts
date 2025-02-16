import { Injectable } from '@nestjs/common';
import * as git from 'isomorphic-git';
import * as fs from 'fs';
import * as http from 'isomorphic-git/http/node';

@Injectable()
export class RepositorySyncService {
    async syncRepository(localRepoPath){
        try {
            await git.pull({
                fs,
                http,
                dir: localRepoPath,
                singleBranch: true,
                author: {
                    name: 'GitHub OAuth User',  
                    email: 'oauth-user@example.com', // TODO: Needs to be updated
                },
            });
        } catch (error) {
            console.error('Error updating repository:', error);
            throw new Error(`Failed to update repository: ${error.message}`);
            }
    }
}
