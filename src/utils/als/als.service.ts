import { Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AlsService {
  private readonly als = new AsyncLocalStorage<Map<string, any>>();

  // runWithrepositoryInfo(
  //   repositoryId: number,
  //   projectName: string,
  //   callback: () => void,
  // ) {
  //   const store = new Map();
  //   this.setRepositoryId(repositoryId);
  //   this.setProjectName(this.getSanitizedProjectName(projectName))
  //   this.als.run(this.als.getStore(), callback);
  // }

  initContext() {
    // create an empty Map for this async execution context
    this.als.enterWith(new Map<string, any>());
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

  getExtension(){
    return this.als.getStore()?.get("extenstion");
  }

  setRepositoryId(repositoryId: number) {
    this.als.getStore()?.set('repositoryId', repositoryId);
  }

  setProjectName(projectName: string) {
    this.als.getStore()?.set('projectName', this.getSanitizedProjectName(projectName));
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

  setExtension(){
    this.als.getStore()?.set('extenstion',this.generateExtension());
  }

  generateExtension() {

    const extension = uuidv4();
    return extension;
  }

  private getSanitizedProjectName(projectName: string): string {
    const sanitizedProjectName = projectName
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '-') 
    .replace(/^[^a-z]+/, 'a')     
    .replace(/-+/g, '-')          
    .replace(/-+$/, '');  

    return sanitizedProjectName;
  }
}
