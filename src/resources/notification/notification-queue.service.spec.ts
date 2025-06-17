import { NotificationQueueService } from './notification-queue.service';
import { NotificationService } from './notification.service';
import { NotificationPreferencesRepositoryInterface } from '@/infrastructure/database/interfaces/notification-preferences-repository-interface/notification-preferences-repository-interface.interface';
import { NotificationType, NotificationPriority, NotificationPreferences } from '@prisma/client';

describe('NotificationQueueService', () => {
  let service: NotificationQueueService;
  let redis: any;
  let notificationService: any;
  let preferencesRepo: any;

  beforeEach(() => {
    redis = {
      on: jest.fn(),
      lpush: jest.fn(),
      rpop: jest.fn(),
      incr: jest.fn(),
      expire: jest.fn(),
    };
    notificationService = {
      createNotification: jest.fn().mockResolvedValue({ id: 123 }),
      sendToUser: jest.fn(),
      broadcastNotification: jest.fn(),
    };
    preferencesRepo = {
      findByUserId: jest.fn(),
    };

    service = new NotificationQueueService(
      redis,
      notificationService as NotificationService,
      preferencesRepo as NotificationPreferencesRepositoryInterface,
    );
  });

  describe('enqueueNotification', () => {
    it('pushes the notification JSON onto Redis list', async () => {
      const notif = { title: 'T', message: 'M', type: NotificationType.SYSTEM, priority: NotificationPriority.LOW };
      await service.enqueueNotification(notif);
      expect(redis.lpush).toHaveBeenCalledWith(
        'notification_queue',
        JSON.stringify(notif),
      );
    });
  });

  describe('processNotification', () => {
    const base = { title: 'T', message: 'M', type: NotificationType.SYSTEM, priority: NotificationPriority.MEDIUM };

    it('creates and broadcasts when no userId', async () => {
      await (service as any).processNotification({ ...base });
      expect(notificationService.createNotification).toHaveBeenCalledWith({ ...base, userId: undefined });
      expect(notificationService.broadcastNotification).toHaveBeenCalledWith({ id: 123 });
      expect(notificationService.sendToUser).not.toHaveBeenCalled();
    });

    it('skips when rate limited', async () => {
      redis.incr.mockResolvedValue(11); // > MAX_NOTIFICATIONS_PER_WINDOW
      const consoleLog = jest.spyOn(console, 'log').mockImplementation(() => {});
      await (service as any).processNotification({ ...base, userId: 1 });
      expect(redis.incr).toHaveBeenCalledWith('notification_rate_limit:1');
      expect(consoleLog).toHaveBeenCalledWith('Rate limited user 1');
      expect(notificationService.createNotification).not.toHaveBeenCalled();
      consoleLog.mockRestore();
    });

    // it('skips when preferences disable this type', async () => {
    //   redis.incr.mockResolvedValue(1);
    //   preferencesRepo.findByUserId.mockResolvedValue({
    //     enabledTypes: { [NotificationType.SYSTEM]: false },
    //     minimumPriority: NotificationPriority.LOW,
    //   } as NotificationPreferences);
    //   await (service as any).processNotification({ ...base, userId: 2 });
    //   expect(preferencesRepo.findByUserId).toHaveBeenCalledWith(2);
    //   expect(notificationService.createNotification).not.toHaveBeenCalled();
    // });

    // it('sends to user when allowed by preferences and rate limit', async () => {
    //   redis.incr.mockResolvedValue(1);
    //   preferencesRepo.findByUserId.mockResolvedValue({
    //     enabledTypes: { [NotificationType.SYSTEM]: true },
    //     minimumPriority: NotificationPriority.LOW,
    //   } as NotificationPreferences);
    //   await (service as any).processNotification({ ...base, userId: 3 });
    //   expect(notificationService.createNotification).toHaveBeenCalledWith({ ...base, userId: 3 });
    //   expect(notificationService.sendToUser).toHaveBeenCalledWith(3, { id: 123 });
    // });
  });

  describe('getPriorityValue (via private logic)', () => {
    it('maps LOW/MEDIUM/HIGH correctly', () => {
      const LOW = (service as any).getPriorityValue(NotificationPriority.LOW);
      const MED = (service as any).getPriorityValue(NotificationPriority.MEDIUM);
      const HI  = (service as any).getPriorityValue(NotificationPriority.HIGH);
      expect(LOW).toBe(1);
      expect(MED).toBe(2);
      expect(HI).toBe(3);
    });
  });
});
