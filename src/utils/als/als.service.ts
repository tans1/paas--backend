import { Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';

@Injectable()
export class AlsService {
  private readonly als = new AsyncLocalStorage<Map<string, any>>();

  runWithrepositoryInfo(
    repositoryId: number,
    projectName: string,
    callback: () => void,
  ) {
    const store = new Map();
    store.set('repositoryId', repositoryId);
    store.set('projectName', this.getSanitizedProjectName(projectName));
    this.als.run(store, callback);
  }

  getrepositoryId(): number | undefined {
    return this.als.getStore()?.get('repositoryId');
  }
  getprojectName(): string | undefined {
    return this.als.getStore()?.get('projectName');
  }
  getbranchName(): string | undefined {
    return this.als.getStore()?.get('branchName');
  }
  getframework(): string | undefined {
    return this.als.getStore()?.get('framework');
  }

  getLastCommitMessage(){
    return this.als.getStore()?.get("lastCommitMessage")
  }
  setbranchName(branchName: string) {
    this.als.getStore()?.set('branchName', branchName);
  }
  setframework(framework: string) {
    this.als.getStore()?.set('framework', framework);
  }

  setLastCommitMessage(lastCommitMessage: string){
    this.als.getStore()?.set('lastCommitMessage',lastCommitMessage);
  }

  private getSanitizedProjectName(projectName: string): string {
    const sanitizedProjectName = projectName
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '-')
      .replace(/^[^a-z]+/, 'a');

    return sanitizedProjectName;
  }
}
