import { ProjectsRepositoryInterface } from '@/infrastructure/database/interfaces/projects-repository-interface/projects-repository-interface.interface';
import { Injectable } from '@nestjs/common';

@Injectable()
export class ProjectsService {
    constructor(private projectsRepositoryService : ProjectsRepositoryInterface){}
    async getProjects(userId: number) {
        return await this.projectsRepositoryService.findByUserId(userId);
    }
}
