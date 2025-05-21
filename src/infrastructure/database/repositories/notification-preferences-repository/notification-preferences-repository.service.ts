import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma-service/prisma-service.service';
import {
  NotificationPreferencesRepositoryInterface,
  CreateNotificationPreferencesDTO,
  UpdateNotificationPreferencesDTO,
} from '../../interfaces/notification-preferences-repository-interface/notification-preferences-repository-interface.interface';
import { NotificationPreferences } from '@prisma/client';

@Injectable()
export class NotificationPreferencesRepositoryService
  extends PrismaService
  implements NotificationPreferencesRepositoryInterface
{
  constructor(private prisma: PrismaService) {
    super();
  }

  async create(
    data: CreateNotificationPreferencesDTO,
  ): Promise<NotificationPreferences> {
    return this.prisma.notificationPreferences.create({
      data: {
        ...data,
        emailNotifications: data.emailNotifications ?? true,
        pushNotifications: data.pushNotifications ?? true,
        inAppNotifications: data.inAppNotifications ?? true,
        minimumPriority: data.minimumPriority ?? 'MEDIUM',
        notifyOnDeployment: data.notifyOnDeployment ?? true,
        notifyOnSecurity: data.notifyOnSecurity ?? true,
        notifyOnSystem: data.notifyOnSystem ?? true,
        notifyOnUpdate: data.notifyOnUpdate ?? true,
      },
    });
  }

  async findByUserId(userId: number): Promise<NotificationPreferences | null> {
    return this.prisma.notificationPreferences.findUnique({
      where: { userId },
    });
  }

  async update(
    userId: number,
    data: UpdateNotificationPreferencesDTO,
  ): Promise<NotificationPreferences> {
    return this.prisma.notificationPreferences.update({
      where: { userId },
      data,
    });
  }

  async delete(userId: number): Promise<void> {
    await this.prisma.notificationPreferences.delete({
      where: { userId },
    });
  }
}
