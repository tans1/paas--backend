import { Role, UserStatus } from "@prisma/client";

export type UpdateUserDto = {
  name?: string;
  password?: string;
  role?: Role;
  githubUsername?: string;
  githubAccessToken?: string;
  status?: UserStatus;
  suspendedAt?: Date;
};

export abstract class UsersRepositoryInterface {
  abstract findAll(): any;
  abstract findOneById(id: number): any;
  abstract findOneBy(email: string): any;
  abstract create(payload: any): any;
  abstract findOneByUserName(userName: string): any;
  abstract updateByEmail(email: string, payload: any): any;
  abstract update(id: number, payload: UpdateUserDto): any;
  abstract remove(id: number): any;

}
