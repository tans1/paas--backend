import { NotificationRepositoryService } from './notification-repository.service';
import { PrismaService } from '../../prisma/prisma-service/prisma-service.service';
import { Notification, NotificationPriority, NotificationType } from '@prisma/client';

describe('NotificationRepositoryService', () => {
  let service: NotificationRepositoryService;
  let mockPrisma: Partial<PrismaService>;

  beforeEach(() => {
    mockPrisma = {
      notification: {
        create: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
        delete: jest.fn(),
        deleteMany: jest.fn(),
      } as any,
    };
    service = new NotificationRepositoryService(mockPrisma as PrismaService);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('create', () => {
    it('calls prisma.notification.create with defaults', async () => {
      const dto = { title: 't', message: 'm', userId: 1 };
      const result = {} as Notification;
      (mockPrisma.notification!.create as jest.Mock).mockResolvedValue(result);

      const res = await service.create(dto);

      expect(mockPrisma.notification!.create).toHaveBeenCalledWith({
        data: {
          ...dto,
          type: 'SYSTEM',
          priority: 'MEDIUM',
        },
      });
      expect(res).toBe(result);
    });

    it('preserves provided type and priority', async () => {
      const dto = { title: 't', message: 'm', userId: 1, type: NotificationType.UPDATE, priority: NotificationPriority.MEDIUM };
      (mockPrisma.notification!.create as jest.Mock).mockResolvedValue({} as Notification);

      await service.create(dto);

      expect(mockPrisma.notification!.create).toHaveBeenCalledWith({
        data: {
          ...dto,
          // explicit type/priority should not be overridden
        },
      });
    });
  });

  describe('findAll', () => {
    it('calls findMany without filter when no userId', async () => {
      (mockPrisma.notification!.findMany as jest.Mock).mockResolvedValue([]);

      await service.findAll();

      expect(mockPrisma.notification!.findMany).toHaveBeenCalledWith({
        where: undefined,
        orderBy: { createdAt: 'desc' },
      });
    });

    it('calls findMany with userId filter', async () => {
      (mockPrisma.notification!.findMany as jest.Mock).mockResolvedValue([]);

      await service.findAll(5);

      expect(mockPrisma.notification!.findMany).toHaveBeenCalledWith({
        where: { userId: 5 },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('findUnread', () => {
    it('finds all unread without userId', async () => {
      (mockPrisma.notification!.findMany as jest.Mock).mockResolvedValue([]);

      await service.findUnread();

      expect(mockPrisma.notification!.findMany).toHaveBeenCalledWith({
        where: { isRead: false },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('finds unread for specific userId', async () => {
      await service.findUnread(7);

      expect(mockPrisma.notification!.findMany).toHaveBeenCalledWith({
        where: { isRead: false, userId: 7 },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('findById', () => {
    it('calls findFirst without userId', async () => {
      (mockPrisma.notification!.findFirst as jest.Mock).mockResolvedValue(null);

      await service.findById('id1');

      expect(mockPrisma.notification!.findFirst).toHaveBeenCalledWith({
        where: { id: 'id1' },
      });
    });

    it('calls findFirst with userId', async () => {
      await service.findById('id2', 9);

      expect(mockPrisma.notification!.findFirst).toHaveBeenCalledWith({
        where: { id: 'id2', userId: 9 },
      });
    });
  });

  describe('markAsRead', () => {
    it('updates single notification as read', async () => {
      const updated = {} as Notification;
      (mockPrisma.notification!.update as jest.Mock).mockResolvedValue(updated);

      const res = await service.markAsRead('id3', 4);

      expect(mockPrisma.notification!.update).toHaveBeenCalledWith({
        where: { id: 'id3', userId: 4 },
        data: { isRead: true, readAt: expect.any(Date) },
      });
      expect(res).toBe(updated);
    });
  });

  describe('markAllAsRead', () => {
    it('updates all unread notifications', async () => {
      await service.markAllAsRead(8);

      expect(mockPrisma.notification!.updateMany).toHaveBeenCalledWith({
        where: { isRead: false, userId: 8 },
        data: { isRead: true, readAt: expect.any(Date) },
      });
    });
  });

  describe('delete', () => {
    it('deletes a notification with userId', async () => {
      await service.delete('id4', 2);

      expect(mockPrisma.notification!.delete).toHaveBeenCalledWith({
        where: { id: 'id4', userId: 2 },
      });
    });
  });

  describe('deleteExpired', () => {
    it('deletes all read before expiryDate', async () => {
      const date = new Date('2020-01-01');
      await service.deleteExpired(date);

      expect(mockPrisma.notification!.deleteMany).toHaveBeenCalledWith({
        where: {
          createdAt: { lt: date },
          isRead: true,
        },
      });
    });
  });
});
