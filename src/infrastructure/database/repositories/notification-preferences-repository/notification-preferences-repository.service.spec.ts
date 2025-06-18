import { NotificationPreferencesRepositoryService } from './notification-preferences-repository.service';
import {
  CreateNotificationPreferencesDTO,
  UpdateNotificationPreferencesDTO,
} from '../../interfaces/notification-preferences-repository-interface/notification-preferences-repository-interface.interface';
import { NotificationPreferences } from '@prisma/client';

describe('NotificationPreferencesRepositoryService', () => {
  let service: NotificationPreferencesRepositoryService;
  let prismaMock: any;

  beforeEach(() => {
    prismaMock = {
      notificationPreferences: {
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };
    service = new NotificationPreferencesRepositoryService(prismaMock as any);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('create', () => {
    it('uses provided values and defaults missing to true/“MEDIUM”', async () => {
      const dto: CreateNotificationPreferencesDTO = {
          userId: 1,
          enabledTypes: undefined
      };
      const expectedData = {
        userId: 1,
        emailNotifications: true,
        pushNotifications: true,
        inAppNotifications: true,
        minimumPriority: 'MEDIUM',
        notifyOnDeployment: true,
        notifyOnSecurity: true,
        notifyOnSystem: true,
        notifyOnUpdate: true,
      };
      const created: NotificationPreferences = {
        userId: 1,
        ...expectedData,
      } as any;
      prismaMock.notificationPreferences.create.mockResolvedValue(created);

      const result = await service.create(dto);

      expect(prismaMock.notificationPreferences.create).toHaveBeenCalledWith({
        data: expectedData,
      });
      expect(result).toBe(created);
    });

    it('preserves explicitly provided flags', async () => {
      const dto: CreateNotificationPreferencesDTO = {
          userId: 2,
          emailNotifications: false,
          pushNotifications: false,
          inAppNotifications: false,
          minimumPriority: 'HIGH',
          notifyOnDeployment: false,
          notifyOnSecurity: false,
          notifyOnSystem: false,
          notifyOnUpdate: false,
          enabledTypes: undefined
      };
      const created: NotificationPreferences = { ...dto } as any;
      prismaMock.notificationPreferences.create.mockResolvedValue(created);

      const result = await service.create(dto);

      expect(prismaMock.notificationPreferences.create).toHaveBeenCalledWith({
        data: dto,
      });
      expect(result).toBe(created);
    });
  });

  describe('findByUserId', () => {
    it('calls findUnique with correct where clause', async () => {
      const found: NotificationPreferences = { userId: 3 } as any;
      prismaMock.notificationPreferences.findUnique.mockResolvedValue(found);

      const result = await service.findByUserId(3);

      expect(prismaMock.notificationPreferences.findUnique).toHaveBeenCalledWith({
        where: { userId: 3 },
      });
      expect(result).toBe(found);
    });
  });

  describe('update', () => {
    it('calls update with correct where and data', async () => {
      const dto: UpdateNotificationPreferencesDTO = {
        inAppNotifications: false,
        minimumPriority: 'LOW',
      };
      const updated: NotificationPreferences = {
        userId: 4,
        inAppNotifications: false,
        minimumPriority: 'LOW',
      } as any;
      prismaMock.notificationPreferences.update.mockResolvedValue(updated);

      const result = await service.update(4, dto);

      expect(prismaMock.notificationPreferences.update).toHaveBeenCalledWith({
        where: { userId: 4 },
        data: dto,
      });
      expect(result).toBe(updated);
    });
  });

  describe('delete', () => {
    it('calls delete with correct where and resolves', async () => {
      prismaMock.notificationPreferences.delete.mockResolvedValue(undefined);

      await expect(service.delete(5)).resolves.toBeUndefined();
      expect(prismaMock.notificationPreferences.delete).toHaveBeenCalledWith({
        where: { userId: 5 },
      });
    });
  });
});
