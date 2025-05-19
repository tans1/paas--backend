export abstract class UsersRepositoryInterface {
  abstract findOneById(id: number): any;
  abstract findOneBy(email: string): any;
  abstract create(payload: any): any;
  abstract findOneByUserName(userName: string): any;
  abstract updateByEmail(email: string, payload: any): any;
}
