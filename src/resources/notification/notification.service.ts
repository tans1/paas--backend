import { NotificationPreferencesRepositoryInterface } from '@/infrastructure/database/interfaces/notification-preferences-repository-interface/notification-preferences-repository-interface.interface';
import { NotificationRepositoryInterface } from '@/infrastructure/database/interfaces/notification-repository-interface/notification-repository-interface.interface';
import { Injectable } from '@nestjs/common';
import {
  NotificationPreferences,
  NotificationType,
  NotificationPriority,
  Notification
} from '@prisma/client';
import { Observable, Subject} from 'rxjs';
import { map } from 'rxjs/operators';
@Injectable()
export class NotificationService {
  private userStreams = new Map<number, Subject<MessageEvent>>();
  constructor(
    private readonly notificationRepository: NotificationRepositoryInterface,
    private readonly preferencesRepository: NotificationPreferencesRepositoryInterface,
  ) {}

  async createNotification(data: {
    title: string;
    message: string;
    type?: NotificationType;
    priority?: NotificationPriority;
    userId?: number;
    metadata?: any;
  }): Promise<Notification> {
    return this.notificationRepository.create({
      ...data,
      type: data.type || NotificationType.SYSTEM,
      priority: data.priority || NotificationPriority.MEDIUM,
    });
  }

  async findAll(userId: number): Promise<Notification[]> {
    return this.notificationRepository.findAll(userId);
  }

  async findUnread(userId: number): Promise<Notification[]> {
    return this.notificationRepository.findUnread(userId);
  }

  async markAsRead(id: string, userId: number): Promise<Notification> {
    return this.notificationRepository.markAsRead(id, userId);
  }

  async markAllAsRead(userId: number): Promise<void> {
    return this.notificationRepository.markAllAsRead(userId);
  }

  async delete(id: string, userId: number): Promise<void> {
    return this.notificationRepository.delete(id, userId);
  }

  async getPreferences(userId: number) {
    return this.preferencesRepository.findByUserId(userId);
  }

  async updatePreferences(userId: number, preferences: any) {
    return this.preferencesRepository.update(userId, preferences);
  }

   sendToUser(userId: number, notification: Notification) {
      this.getUserStream(userId).next({
        data: JSON.stringify(notification),
      } as MessageEvent);
    }
  
    broadcastNotification(notification: Notification) {
      for (const stream of this.userStreams.values()) {
        stream.next({ data: JSON.stringify(notification) } as MessageEvent);
      }
    }

    getUserStream(userId: number): Subject<MessageEvent> {
        if (!this.userStreams.has(userId)) {
          this.userStreams.set(userId, new Subject<MessageEvent>());
        }
        return this.userStreams.get(userId);
      }
    
}