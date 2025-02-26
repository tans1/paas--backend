import { ProjectsRepositoryInterface, CreateProjectDTO} from '@/infrastructure/database/interfaces/projects-repository-interface/projects-repository-interface.interface';
import { UsersRepositoryInterface } from '@/infrastructure/database/interfaces/users-repository-interface/users-repository-interface.interface';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';


// TODO: move this to projects module
@Injectable()
export class ProjectService {
  constructor(private projectRepositoryService: ProjectsRepositoryInterface, 
    private userService : UsersRepositoryInterface
  ) {}

  public async createProject(payload: any){
    try{
      const repository = payload.repository;
      const userName =  repository.owner.login;
      const user = await this.userService.findOneByUserName(userName)
      
      const createProjectDto: CreateProjectDTO = {
        name: repository?.name,
        url: repository?.html_url || repository?.url,
        linkedByUserId: user?.id,
        repoId : repository?.id
      };
  
      return await this.projectRepositoryService.create(createProjectDto);

    }
    catch(error){
      console.error('Error creating project:', error);
      
      throw new HttpException(
        error.message,
        HttpStatus.INTERNAL_SERVER_ERROR
      );

    }
   
  }
}
