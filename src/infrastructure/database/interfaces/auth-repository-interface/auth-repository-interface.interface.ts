import { User, PasswordReset } from '@prisma/client';

export abstract class AuthRepositoryInterface {
  abstract findUserByEmail(email: string): Promise<User | null>;

  abstract createPasswordReset(params: {
    userId: number;
    token: string;
    expiresAt: Date;
  }): Promise<PasswordReset>;

  abstract findPasswordResetByToken(
    token: string,
  ): Promise<(PasswordReset & { user: User }) | null>;

  abstract updateUserPassword(
    userId: number,
    hashedPassword: string,
  ): Promise<User>;

  abstract deletePasswordResetsByUser(
    userId: number,
  ): Promise<{ count: number }>;
}

