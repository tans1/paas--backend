import { Injectable } from '@nestjs/common';
import * as git from 'isomorphic-git';
import * as fs from 'fs';
import * as http from 'isomorphic-git/http/node';

@Injectable()
export class RepositorySyncService {
    async syncRepository(localRepoPath: string,userName: string, userEmail: string) {
        // TODO: pull should be performed for the branch the user wants to sync
        try {
            await git.pull({
                fs,
                http,
                dir: localRepoPath,
                singleBranch: true,
                author: { name: userName, email: userEmail },
                fastForwardOnly: true 
            });
        } catch (error) {
            console.error('Sync failed:', error);
            throw new Error(`Sync failed: ${error.message}`);
        }
    }
}
