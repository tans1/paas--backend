import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';
import { NotificationQueueService } from './notification-queue.service';
import { NotificationType, NotificationPriority, Notification } from '@prisma/client';
import { Subject, Observable } from 'rxjs';

describe('NotificationController', () => {
  let controller: NotificationController;
  let notificationService: jest.Mocked<Partial<NotificationService>>;
  let queueService: jest.Mocked<Partial<NotificationQueueService>>;

  beforeEach(() => {
    notificationService = {
      getUserStream: jest.fn(),
      findAll: jest.fn(),
      findUnread: jest.fn(),
      markAsRead: jest.fn(),
      markAllAsRead: jest.fn(),
      delete: jest.fn(),
    };
    queueService = {
      enqueueNotification: jest.fn(),
    };

    controller = new NotificationController(
      notificationService as unknown as NotificationService,
      queueService as unknown as NotificationQueueService,
    );
  });

  it('testNotification enqueues and returns status', async () => {
    (queueService.enqueueNotification as jest.Mock).mockResolvedValue(undefined);

    const result = await controller.testNotification({ userId: 5 });
    expect(queueService.enqueueNotification).toHaveBeenCalledWith({
      title: 'Test Notification',
      message: 'This is a system test',
      type: NotificationType.SYSTEM,
      priority: NotificationPriority.HIGH,
      userId: 5,
    });
    expect(result).toEqual({ status: 'Notification queued' });
  });

  it('sse returns user stream as observable', () => {
    const subj = new Subject<MessageEvent>();
    (notificationService.getUserStream as jest.Mock).mockReturnValue(subj);

    const fakeReq = { user: { sub: 7 } } as any;
    const obs = controller.sse(fakeReq);

    expect(notificationService.getUserStream).toHaveBeenCalledWith(7);
    expect(obs).toBeInstanceOf(Observable);
  });

  it('userSse returns specific user stream', () => {
    const subj = new Subject<MessageEvent>();
    (notificationService.getUserStream as jest.Mock).mockReturnValue(subj);

    const obs = controller.userSse(8);
    expect(notificationService.getUserStream).toHaveBeenCalledWith(8);
    expect(obs).toBeInstanceOf(Observable);
  });

  it('REST endpoints delegate correctly', async () => {
    const sample: Notification[] = [];
    (notificationService.findAll as jest.Mock).mockResolvedValue(sample);
    (notificationService.findUnread as jest.Mock).mockResolvedValue(sample);
    (notificationService.markAsRead as jest.Mock).mockResolvedValue(sample[0]);
    (notificationService.markAllAsRead as jest.Mock).mockResolvedValue(undefined);
    (notificationService.delete as jest.Mock).mockResolvedValue(undefined);

    const fakeReq = { user: { sub: 9 } } as any;

    // findAll
    const all = await controller.findAll(fakeReq);
    expect(all).toBe(sample);
    expect(notificationService.findAll).toHaveBeenCalledWith(9);

    // findUnread
    const unread = await controller.findUnread(fakeReq);
    expect(unread).toBe(sample);
    expect(notificationService.findUnread).toHaveBeenCalledWith(9);

    // markAllAsRead
    await controller.markAllAsRead(fakeReq);
    expect(notificationService.markAllAsRead).toHaveBeenCalledWith(9);

    // markAsRead
    const read = await controller.markAsRead('nid', fakeReq);
    expect(read).toBe(sample[0]);
    expect(notificationService.markAsRead).toHaveBeenCalledWith('nid', 9);

    // delete
    await controller.delete('did', fakeReq);
    expect(notificationService.delete).toHaveBeenCalledWith('did', 9);
  });
});
