import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma-service/prisma-service.service';
import {
  NotificationRepositoryInterface,
  CreateNotificationDTO,
  UpdateNotificationDTO,
} from '../../interfaces/notification-repository-interface/notification-repository-interface.interface';
import { Notification } from '@prisma/client';

@Injectable()
export class NotificationRepositoryService
  implements NotificationRepositoryInterface
{
  constructor(private prisma: PrismaService) {
  }

  async create(data: CreateNotificationDTO): Promise<Notification> {
    return this.prisma.notification.create({
      data: {
        ...data,
        type: data.type || 'SYSTEM',
        priority: data.priority || 'MEDIUM',
      },
    });
  }

  async findAll(userId?: number): Promise<Notification[]> {
    return this.prisma.notification.findMany({
      where: userId ? { userId } : undefined,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findUnread(userId?: number): Promise<Notification[]> {
    return this.prisma.notification.findMany({
      where: {
        isRead: false,
        ...(userId ? { userId } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string, userId?: number): Promise<Notification | null> {
    return this.prisma.notification.findFirst({
      where: {
        id,
        ...(userId ? { userId } : {}),
      },
    });
  }

  async markAsRead(id: string, userId?: number): Promise<Notification> {
    return this.prisma.notification.update({
      where: {
        id,
        ...(userId ? { userId } : {}),
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  }

  async markAllAsRead(userId?: number): Promise<void> {
    await this.prisma.notification.updateMany({
      where: {
        isRead: false,
        ...(userId ? { userId } : {}),
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  }

  async delete(id: string, userId?: number): Promise<void> {
    await this.prisma.notification.delete({
      where: {
        id,
        ...(userId ? { userId } : {}),
      },
    });
  }

  async deleteExpired(expiryDate: Date): Promise<void> {
    await this.prisma.notification.deleteMany({
      where: {
        createdAt: { lt: expiryDate },
        isRead: true,
      },
    });
  }
}
