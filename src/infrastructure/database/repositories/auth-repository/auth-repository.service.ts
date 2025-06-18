import { Injectable } from '@nestjs/common';
import { AuthRepositoryInterface } from './../../interfaces/auth-repository-interface/auth-repository-interface.interface';
import { PrismaService } from '../../prisma/prisma-service/prisma-service.service';
import { PasswordReset, User } from '@prisma/client';
@Injectable()
export class AuthRepositoryService
  implements AuthRepositoryInterface {

    constructor(private prisma: PrismaService){}

    async findUserByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  /** Create a PasswordReset record */
  async createPasswordReset(data: {
    userId: number;
    token: string;
    expiresAt: Date;
  }): Promise<PasswordReset> {
    return this.prisma.passwordReset.create({
      data: {
        userId: data.userId,
        token: data.token,
        expiresAt: data.expiresAt,
      },
    });
  }

  /** Look up a PasswordReset record by token, including the related user */
  async findPasswordResetByToken(
    token: string,
  ): Promise<PasswordReset & { user: User } | null> {
    return this.prisma.passwordReset.findUnique({
      where: { token },
      include: { user: true },
    });
  }

  /** Update a user’s password hash */
  async updateUserPassword(userId: number, hashedPassword: string): Promise<User> {
    return this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });
  }

  /** Delete all PasswordReset records for a given user */
  async deletePasswordResetsByUser(userId: number): Promise<{ count: number }> {
    return this.prisma.passwordReset.deleteMany({
      where: { userId },
    });
  }
  }
