import { Injectable } from "@nestjs/common";
import { AsyncLocalStorage } from "async_hooks";

@Injectable()
export class AlsService {
  private readonly als = new AsyncLocalStorage<Map<string, any>>();

  runWithrepositoryInfo(repositoryId: string,repositoryName : string, callback: () => void) {
    const store = new Map();
    store.set("repositoryId", repositoryId);
    store.set("repositoryName", repositoryName);
    this.als.run(store, callback);
  }

  getrepositoryId(): string | undefined {
    return this.als.getStore()?.get("repositoryId");
  }
  getrepositoryName(): string | undefined {
    return this.als.getStore()?.get("repositoryName");
  }
}
