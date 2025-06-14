// src/auth/auth.service.ts

import { Injectable, BadRequestException } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { randomBytes } from 'crypto';
import { addHours } from 'date-fns';
import * as bcrypt from 'bcrypt';
import { AuthRepositoryInterface } from '@/infrastructure/database/interfaces/auth-repository-interface/auth-repository-interface.interface';

@Injectable()
export class AuthService {
  constructor(
    private readonly repo: AuthRepositoryInterface,
    private readonly mailer: MailerService,
  ) {}

  
  async forgotPassword(email: string): Promise<void> {
    const user = await this.repo.findUserByEmail(email);
    if (!user) return; // always silent to prevent email enumeration

    const token = randomBytes(32).toString('hex');
    const expiresAt = addHours(new Date(), 1);

    await this.repo.createPasswordReset({ userId: user.id, token, expiresAt });

    const resetUrl = `${process.env.FRONT_END_URL}/reset-password?token=${token}`;
    await this.mailer.sendMail({
      to: user.email,
      subject: 'Reset your password',
      template: 'reset-password',
      context: { resetUrl },
    });
  }

  
  async resetPassword(token: string, newPassword: string): Promise<void> {
    const record = await this.repo.findPasswordResetByToken(token);
    if (!record || record.expiresAt < new Date()) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await this.repo.updateUserPassword(record.userId, hashed);
    await this.repo.deletePasswordResetsByUser(record.userId);
  }
}
