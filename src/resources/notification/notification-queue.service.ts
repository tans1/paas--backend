import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';
import { NotificationService } from './notification.service';
import { NotificationPreferencesRepositoryInterface } from '@/infrastructure/database/interfaces/notification-preferences-repository-interface/notification-preferences-repository-interface.interface';
import {
  NotificationPreferences,
  NotificationType,
  NotificationPriority,
} from '@prisma/client';
@Injectable()
export class NotificationQueueService implements OnModuleInit {
  private readonly NOTIFICATION_QUEUE = 'notification_queue';
  private readonly RATE_LIMIT_PREFIX = 'notification_rate_limit:';
  private readonly RATE_LIMIT_WINDOW = 60;
  private readonly MAX_NOTIFICATIONS_PER_WINDOW = 10;

  constructor(
    @InjectRedis() private readonly redis: Redis,
    private readonly notificationService: NotificationService,
    private readonly notificationPreferencesRepository: NotificationPreferencesRepositoryInterface
  ) {}

  async onModuleInit() {
    this.processQueue();
  }

  async enqueueNotification(notification: {
    title: string;
    message: string;
    type: NotificationType;
    priority: NotificationPriority;
    userId?: number;
    metadata?: any;
  }) {
    await this.redis.lpush(
      this.NOTIFICATION_QUEUE,
      JSON.stringify(notification),
    );
  }

  private async processQueue() {
    while (true) {
      try {
        const notificationData = await this.redis.rpop(this.NOTIFICATION_QUEUE);
        if (notificationData) {
          const notification = JSON.parse(notificationData);
          await this.processNotification(notification);
        }
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (error) {
        console.error('Queue processing error:', error);
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
  }

  private async processNotification(notification: {
    title: string;
    message: string;
    type: NotificationType;
    priority: NotificationPriority;
    userId?: number;
    metadata?: any;
  }) {
    if (notification.userId) {
      if (await this.checkRateLimit(notification.userId)) {
        console.log(`Rate limited user ${notification.userId}`);
        return;
      }
      
      const preferences = await this.notificationPreferencesRepository.findByUserId(notification.userId);

      if (preferences && !this.isNotificationAllowed(notification, preferences)) {
        return;
      }
    }

    // Store in database
    const dbNotification = await this.notificationService.createNotification({
      ...notification,
      userId: notification.userId,
    });

    // Send SSE
    if (notification.userId) {
      this.notificationService.sendToUser(notification.userId, dbNotification);
    } else {
      this.notificationService.broadcastNotification(dbNotification);
    }
  }

  private isNotificationAllowed(
    notification: any,
    preferences: NotificationPreferences
  ): boolean {
    return (
      preferences.enabledTypes[notification.type] &&
      this.getPriorityValue(notification.priority) >=
        this.getPriorityValue(preferences.minimumPriority)
    );
  }

  private async checkRateLimit(userId: number): Promise<boolean> {
    const key = `${this.RATE_LIMIT_PREFIX}${userId}`;
    const current = await this.redis.incr(key);
    if (current === 1) await this.redis.expire(key, this.RATE_LIMIT_WINDOW);
    return current > this.MAX_NOTIFICATIONS_PER_WINDOW;
  }

  private getPriorityValue(priority: NotificationPriority): number {
    return { LOW: 1, MEDIUM: 2, HIGH: 3 }[priority] || 0;
  }
}