export abstract class UsersRepositoryInterface {
  abstract findOneBy(email: string): any;
  abstract create(payload: any): any;
}
