import { NotificationService } from './notification.service';
import { NotificationRepositoryInterface } from '@/infrastructure/database/interfaces/notification-repository-interface/notification-repository-interface.interface';
import { NotificationPreferencesRepositoryInterface } from '@/infrastructure/database/interfaces/notification-preferences-repository-interface/notification-preferences-repository-interface.interface';
import { NotificationType, NotificationPriority, Notification } from '@prisma/client';
import { Subject } from 'rxjs';

describe('NotificationService', () => {
  let service: NotificationService;
  let repo: jest.Mocked<NotificationRepositoryInterface>;
  let prefRepo: jest.Mocked<NotificationPreferencesRepositoryInterface>;

  beforeEach(() => {
    repo = {
      create: jest.fn(),
      findAll: jest.fn(),
      findUnread: jest.fn(),
      markAsRead: jest.fn(),
      markAllAsRead: jest.fn(),
      delete: jest.fn(),
      findById: jest.fn(), 
      deleteExpired: jest.fn(),
    };
    prefRepo = {
      findByUserId: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
      delete: jest.fn()
    };
    service = new NotificationService(repo, prefRepo);
  });

  describe('createNotification', () => {
    it('calls repository.create with defaults', async () => {
      const saved: Notification = { id: '1', title: 'T', message: 'M', type: NotificationType.SYSTEM, priority: NotificationPriority.MEDIUM, userId: 2, metadata: null, createdAt: new Date(), isRead: true, readAt: null };
      repo.create.mockResolvedValueOnce(saved);

      const res = await service.createNotification({ title: 'T', message: 'M', userId: 2 } as any);
      expect(repo.create).toHaveBeenCalledWith({
        title: 'T',
        message: 'M',
        userId: 2,
        type: NotificationType.SYSTEM,
        priority: NotificationPriority.MEDIUM,
        metadata: undefined,
      });
      expect(res).toBe(saved);
    });
  });

  describe('findAll / findUnread / markAsRead / markAllAsRead / delete', () => {
    it('findAll delegates', async () => {
      repo.findAll.mockResolvedValueOnce([]);
      expect(await service.findAll(5)).toEqual([]);
      expect(repo.findAll).toHaveBeenCalledWith(5);
    });

    it('findUnread delegates', async () => {
      repo.findUnread.mockResolvedValueOnce([]);
      expect(await service.findUnread(6)).toEqual([]);
      expect(repo.findUnread).toHaveBeenCalledWith(6);
    });

    it('markAsRead delegates', async () => {
      const n: Notification = {} as any;
      repo.markAsRead.mockResolvedValueOnce(n);
      expect(await service.markAsRead('x', 7)).toBe(n);
      expect(repo.markAsRead).toHaveBeenCalledWith('x', 7);
    });

    it('markAllAsRead delegates', async () => {
      repo.markAllAsRead.mockResolvedValueOnce(undefined);
      await service.markAllAsRead(8);
      expect(repo.markAllAsRead).toHaveBeenCalledWith(8);
    });

    it('delete delegates', async () => {
      repo.delete.mockResolvedValueOnce(undefined);
      await service.delete('y', 9);
      expect(repo.delete).toHaveBeenCalledWith('y', 9);
    });
  });

  describe('preferences', () => {
    it('getPreferences delegates', async () => {
      prefRepo.findByUserId.mockResolvedValueOnce({} as any);
      await service.getPreferences(10);
      expect(prefRepo.findByUserId).toHaveBeenCalledWith(10);
    });

    it('updatePreferences delegates', async () => {
      prefRepo.update.mockResolvedValueOnce({} as any);
      await service.updatePreferences(11, { foo: 'bar' });
      expect(prefRepo.update).toHaveBeenCalledWith(11, { foo: 'bar' });
    });
  });

  describe('sendToUser / broadcastNotification', () => {
    it('sendToUser pushes to the correct stream', () => {
      const subj = new Subject<MessageEvent>();
      jest.spyOn(service, 'getUserStream').mockReturnValue(subj);
      const notif = { id: 'n' } as Notification;
      const nextSpy = jest.spyOn(subj, 'next');
      service.sendToUser(1, notif);
      expect(service.getUserStream).toHaveBeenCalledWith(1);
      expect(nextSpy).toHaveBeenCalledWith({ data: JSON.stringify(notif) } as MessageEvent);
    });

    it('broadcastNotification pushes to all streams', () => {
      const s1 = new Subject<MessageEvent>();
      const s2 = new Subject<MessageEvent>();
      service['userStreams'].set(1, s1);
      service['userStreams'].set(2, s2);
      const n = { id: 'b' } as Notification;
      const spy1 = jest.spyOn(s1, 'next');
      const spy2 = jest.spyOn(s2, 'next');
      service.broadcastNotification(n);
      expect(spy1).toHaveBeenCalledWith({ data: JSON.stringify(n) } as MessageEvent);
      expect(spy2).toHaveBeenCalledWith({ data: JSON.stringify(n) } as MessageEvent);
    });
  });
});
