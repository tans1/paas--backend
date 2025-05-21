import {
  NotificationPreferences,
  NotificationType,
  NotificationPriority,
} from '@prisma/client';

export interface CreateNotificationPreferencesDTO {
  userId: number;
  enabledTypes: { [key in NotificationType]: boolean };
  emailNotifications?: boolean;
  pushNotifications?: boolean;
  inAppNotifications?: boolean;
  minimumPriority?: NotificationPriority;
  notifyOnDeployment?: boolean;
  notifyOnSecurity?: boolean;
  notifyOnSystem?: boolean;
  notifyOnUpdate?: boolean;
}

export interface UpdateNotificationPreferencesDTO {
  enabledTypes?: { [key in NotificationType]: boolean };
  emailNotifications?: boolean;
  pushNotifications?: boolean;
  inAppNotifications?: boolean;
  minimumPriority?: NotificationPriority;
  notifyOnDeployment?: boolean;
  notifyOnSecurity?: boolean;
  notifyOnSystem?: boolean;
  notifyOnUpdate?: boolean;
}

export abstract class NotificationPreferencesRepositoryInterface {
  abstract create(
    data: CreateNotificationPreferencesDTO,
  ): Promise<NotificationPreferences>;
  abstract findByUserId(userId: number): Promise<NotificationPreferences | null>;
  abstract update(
    userId: number,
    data: UpdateNotificationPreferencesDTO,
  ): Promise<NotificationPreferences>;
  abstract delete(userId: number): Promise<void>;
}
