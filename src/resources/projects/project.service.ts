// import { Injectable } from '@nestjs/common';
// import { InjectRepository } from '@nestjs/typeorm';
// import { Repository } from 'typeorm';
// import { Project } from './entities/project.entity';
// import { Deployment } from './entities/deployment.entity';

// @Injectable()
// export class ProjectService {
//   constructor(
//     @InjectRepository(Project)
//     private projectRepository: Repository<Project>,
//     @InjectRepository(Deployment)
//     private deploymentRepository: Repository<Deployment>,
//   ) {}

//   async findOne(id: number) {
//     return this.projectRepository.findOne({
//       where: { id },
//       relations: ['user'],
//     });
//   }

//   async getDeployment(id: number) {
//     return this.deploymentRepository.findOne({
//       where: { id },
//       relations: ['project'],
//     });
//   }
// }
