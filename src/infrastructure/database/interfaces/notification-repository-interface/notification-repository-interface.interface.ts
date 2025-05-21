import {
  Notification,
  NotificationType,
  NotificationPriority,
} from '@prisma/client';

export interface CreateNotificationDTO {
  title: string;
  message: string;
  type?: NotificationType;
  priority?: NotificationPriority;
  userId?: number;
  metadata?: any;
}

export interface UpdateNotificationDTO {
  isRead?: boolean;
  readAt?: Date;
}

export abstract class NotificationRepositoryInterface {
  abstract create(data: CreateNotificationDTO): Promise<Notification>;
  abstract findAll(userId?: number): Promise<Notification[]>;
  abstract findUnread(userId?: number): Promise<Notification[]>;
  abstract findById(id: string, userId?: number): Promise<Notification | null>;
  abstract markAsRead(id: string, userId?: number): Promise<Notification>;
  abstract markAllAsRead(userId?: number): Promise<void>;
  abstract delete(id: string, userId?: number): Promise<void>;
  abstract deleteExpired(expiryDate: Date): Promise<void>;
}
