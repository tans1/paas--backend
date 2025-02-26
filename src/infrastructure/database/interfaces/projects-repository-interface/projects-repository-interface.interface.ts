import { Project } from '@prisma/client';

export interface CreateProjectDTO {
  name: string;
  repoId: number;
  url: string;
  linkedByUserId: number;
}

export interface UpdateProjectDTO {
  name?: string;
  url?: string;
  deployedIp?: string;
  deployedPort?: number;

}

export abstract class ProjectsRepositoryInterface {
  abstract create(payload: CreateProjectDTO): Promise<Project>;
  abstract findByRepoId(id: number): Promise<Project | null>;
  abstract findByUserId(id: number): Promise<Project[]>;
  abstract findById(id: number): Promise<Project | null>;
  abstract update(id: number, payload: UpdateProjectDTO): Promise<Project>;
  abstract delete(id: number): Promise<void>;
  abstract list(filters?: Partial<Project>): Promise<Project[]>;
  abstract addDeployment(projectId: number, deploymentId: number): Promise<void>;
}

// model Project {
//   id             Int      @id @default(autoincrement())
//   repoId         Int     @unique @map("repo_id")
//   name           String   @db.VarChar(255)
//   url            String   @db.VarChar(2083)
//   linkedByUser   User     @relation("UserProjects", fields: [linkedByUserId], references: [id])
//   linkedByUserId Int
//   createdAt      DateTime @default(now()) @map("created_at")

//   deployedIp String? @map("deployed_ip")
//   deployedPort Int? @map("deployed_port")

//   deployments Deployment[]
// }
// User


