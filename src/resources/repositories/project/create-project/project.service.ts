import { ProjectsRepositoryInterface, CreateProjectDTO} from '@/infrastructure/database/interfaces/projects-repository-interface/projects-repository-interface.interface';
import { UsersRepositoryInterface } from '@/infrastructure/database/interfaces/users-repository-interface/users-repository-interface.interface';
import { Injectable } from '@nestjs/common';


@Injectable()
export class ProjectService {
  constructor(private projectRepositoryService: ProjectsRepositoryInterface, 
    private userService : UsersRepositoryInterface
  ) {}

  public async createProject(payload: any): Promise<void> {
    const repository = payload.repository;
    const sender = payload.sender; // instead of doing this,
    // let's try to access the user using their username
    // then let's access their id and we should be good
    const userName =  repository.owner.login;
    const user = await this.userService.findOneByUserName(userName)
    
    const createProjectDto: CreateProjectDTO = {
      name: repository?.name,
      url: repository?.html_url || repository?.url,
      linkedByUserId: user?.id,
    };

    await this.projectRepositoryService.create(createProjectDto);
  }
}
