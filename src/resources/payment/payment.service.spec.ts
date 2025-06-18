import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { Logger } from '@nestjs/common';
import type { AxiosResponse, AxiosRequestConfig } from 'axios';
import { PaymentService } from './payment.service';
import { PrismaService } from '../../infrastructure/database/prisma/prisma-service/prisma-service.service';
import { ManageContainerService } from '../../core/container-setup/manage-containers/manage-containers.service';

// Rest of the test file...
describe('PaymentService', () => {
  let service: PaymentService;
  let httpService: HttpService;
  let prisma: PrismaService;
  let containerService: ManageContainerService;

  // Mock data
  const mockUser = {
    id: 1,
    email: 'user@example.com',
    role: 'INACTIVE',
  };

  const mockInvoice = {
    id: 1,
    TxRef: 'chapa-tx-123',
    userId: 1,
    amount: 1000,
    status: 'PENDING',
    paymentLink: 'https://payment.link/123',
  };

  const mockBillingRecord = {
    id: 1,
    userId: 1,
    amount: 1000,
    status: 'PAID',
    createdAt: new Date(),
  };

  const mockProject = {
    id: 1,
    linkedByUserId: 1,
    activeDeploymentId: 1,
  };

  const mockDeployment = {
    id: 1,
    containerId: 'container-123',
  };

  const mockChapaResponse: AxiosResponse = {
    data: {
      status: 'success',
      data: {
        status: 'success',
        amount: 1000,
        currency: 'ETB',
      },
    },
    status: 200,
    statusText: 'OK',
    headers: {},
    config: {} as AxiosRequestConfig,
  };

  beforeAll(() => {
    // Set environment variable for CHAPA_TOKEN
    process.env.CHAPA_TOKEN = 'test-token';
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentService,
        {
          provide: HttpService,
          useValue: {
            axiosRef: {
              get: jest.fn().mockResolvedValue(mockChapaResponse),
            },
          },
        },
        {
          provide: PrismaService,
          useValue: {
            invoice: {
              findFirst: jest.fn().mockResolvedValue(mockInvoice),
              update: jest.fn().mockResolvedValue({ ...mockInvoice, status: 'PAID' }),
            },
            user: {
              findUnique: jest.fn().mockResolvedValue(mockUser),
              update: jest.fn().mockResolvedValue({ ...mockUser, role: 'ACTIVE' }),
            },
            billingRecord: {
              create: jest.fn().mockResolvedValue(mockBillingRecord),
              findFirst: jest.fn().mockResolvedValue(mockBillingRecord),
            },
            project: {
              findMany: jest.fn().mockResolvedValue([mockProject]),
            },
            deployment: {
              findUnique: jest.fn().mockResolvedValue(mockDeployment),
            },
            dailyMetric: {
              aggregate: jest.fn().mockResolvedValue({
                _sum: { amount: 500 },
              }),
            },
          },
        },
        {
          provide: ManageContainerService,
          useValue: {
            reStartStoppedContainer: jest.fn().mockResolvedValue(true),
          },
        },
      ],
    }).compile();

    service = module.get<PaymentService>(PaymentService);
    httpService = module.get<HttpService>(HttpService);
    prisma = module.get<PrismaService>(PrismaService);
    containerService = module.get<ManageContainerService>(ManageContainerService);

    // Mock logger methods
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => {});
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('verifyPayment', () => {
    it('should successfully verify and process a payment', async () => {
      await service.verifyPayment('chapa-tx-123');

      expect(httpService.axiosRef.get).toHaveBeenCalledWith(
        'https://api.chapa.co/v1/transaction/verify/chapa-tx-123',
        expect.objectContaining({
          headers: {
            Authorization: `Bearer test-token`,
            'Content-Type': 'application/json',
          },
        }),
      );

      expect(prisma.invoice.findFirst).toHaveBeenCalledWith({
        where: { TxRef: 'chapa-tx-123' },
      });

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });

      expect(prisma.invoice.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          status: 'PAID',
          updatedAt: expect.any(Date),
        },
      });

      expect(prisma.billingRecord.create).toHaveBeenCalledWith({
        data: {
          userId: 1,
          amount: 1000,
          status: 'PAID',
        },
      });

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { role: 'ACTIVE' },
      });

      expect(prisma.project.findMany).toHaveBeenCalledWith({
        where: { linkedByUserId: 1 },
      });

      expect(prisma.deployment.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });

      expect(containerService.reStartStoppedContainer).toHaveBeenCalledWith('', mockDeployment);

      expect(Logger.prototype.log).toHaveBeenCalledWith(`Payment verified and user ${mockUser.id} activated`);
    });

    it('should handle failed transaction verification', async () => {
      const failedResponse: AxiosResponse = {
        ...mockChapaResponse,
        data: { status: 'failed', data: { status: 'failed' } },
      };
      jest.spyOn(httpService.axiosRef, 'get').mockResolvedValueOnce(failedResponse);

      await service.verifyPayment('chapa-tx-123');

      expect(Logger.prototype.warn).toHaveBeenCalledWith(
        'Transaction not successful for tx_ref: chapa-tx-123',
      );
      expect(prisma.invoice.findFirst).not.toHaveBeenCalled();
    });

    it('should handle invoice not found', async () => {
      jest.spyOn(prisma.invoice, 'findFirst').mockResolvedValueOnce(null);

      await service.verifyPayment('invalid-tx-ref');

      expect(Logger.prototype.error).toHaveBeenCalledWith(
        'Invoice not found for tx_ref: invalid-tx-ref',
      );
      expect(prisma.user.findUnique).not.toHaveBeenCalled();
    });

    it('should handle user not found', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValueOnce(null);

      await service.verifyPayment('chapa-tx-123');

      expect(Logger.prototype.error).toHaveBeenCalledWith(
        `User not found for invoice ID: ${mockInvoice.id}`,
      );
      expect(prisma.invoice.update).not.toHaveBeenCalled();
    });

    it('should handle API errors', async () => {
      const error = new Error('API Error');
      jest.spyOn(httpService.axiosRef, 'get').mockRejectedValueOnce(error);

      await expect(service.verifyPayment('chapa-tx-123')).rejects.toThrow('API Error');
      expect(Logger.prototype.error).toHaveBeenCalledWith(
        'Payment verification failed for tx_ref: chapa-tx-123',
        error,
      );
    });
  });

  describe('getDetails', () => {
    it('should return payment details for user', async () => {
      const result = await service.getDetails('user@example.com');

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'user@example.com' },
      });

      expect(prisma.dailyMetric.aggregate).toHaveBeenCalledWith({
        where: {
          userId: mockUser.id,
          date: {
            gte: expect.any(Date),
            lte: expect.any(Date),
          },
        },
        _sum: {
          amount: true,
        },
      });

      expect(prisma.billingRecord.findFirst).toHaveBeenCalledWith({
        where: { userId: mockUser.id },
        orderBy: { createdAt: 'desc' },
      });

      expect(prisma.invoice.findFirst).toHaveBeenCalledWith({
        where: {
          userId: mockUser.id,
          status: {
            in: ['PENDING', 'GENERATED', 'OVERDUE'],
          },
        },
      });

      expect(result).toEqual({
        currentStatus: 'NOT-REACHED',
        previousAmount: 1000,
        currentPaymentAmount: 500,
        nextPaymentDate: expect.any(Date),
        paymentLink: 'https://payment.link/123',
      });
    });

    it('should return undefined for non-existent user', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValueOnce(null);

      const result = await service.getDetails('nonexistent@example.com');
      expect(result).toBeUndefined();
    });

    it('should handle pending invoice with GENERATED status', async () => {
      jest.spyOn(prisma.invoice, 'findFirst').mockResolvedValueOnce({
        ...mockInvoice,
        status: 'GENERATED',
      });

      const result = await service.getDetails('user@example.com');

      expect(result).toEqual({
        currentStatus: 'PENDING',
        previousAmount: 1000,
        currentPaymentAmount: 1000,
        nextPaymentDate: expect.any(Date),
        paymentLink: 'https://payment.link/123',
      });
    });

    it('should handle pending invoice with OVERDUE status', async () => {
      jest.spyOn(prisma.invoice, 'findFirst').mockResolvedValueOnce({
        ...mockInvoice,
        status: 'OVERDUE',
      });

      const result = await service.getDetails('user@example.com');

      expect(result).toEqual({
        currentStatus: 'OVERDUE',
        previousAmount: 1000,
        currentPaymentAmount: 1000,
        nextPaymentDate: expect.any(Date),
        paymentLink: 'https://payment.link/123',
      });
    });
  });

  describe('getPaymentLink', () => {
    it('should return payment link for user', async () => {
      const result = await service.getPaymentLink('user@example.com');

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'user@example.com' },
      });

      expect(prisma.invoice.findFirst).toHaveBeenCalledWith({
        where: {
          userId: mockUser.id,
          status: {
            in: ['GENERATED', 'OVERDUE'],
          },
        },
      });

      expect(result).toEqual(mockInvoice);
    });

    it('should return undefined for non-existent user', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValueOnce(null);

      const result = await service.getPaymentLink('nonexistent@example.com');
      expect(result).toBeUndefined();
    });
  });

  describe('updateUserServices', () => {
    it('should update user role and restart containers', async () => {
      // Test indirectly through verifyPayment
      await service.verifyPayment('chapa-tx-123');

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: { role: 'ACTIVE' },
      });

      expect(prisma.project.findMany).toHaveBeenCalledWith({
        where: { linkedByUserId: mockUser.id },
      });

      expect(prisma.deployment.findUnique).toHaveBeenCalledWith({
        where: { id: mockProject.activeDeploymentId },
      });

      expect(containerService.reStartStoppedContainer).toHaveBeenCalledWith('', mockDeployment);
    });
  });

  describe('getPreviousMonthRange', () => {
    it('should return correct date range for previous month', () => {
      // Use a fixed date for deterministic testing
      jest.useFakeTimers().setSystemTime(new Date('2025-06-12T18:30:00Z'));

      // Access private method via type assertion
      const getPreviousMonthRange = (service as any).getPreviousMonthRange;
      const result = getPreviousMonthRange();

      expect(result.firstDay).toEqual(new Date('2025-05-01T00:00:00Z'));
      expect(result.lastDay).toEqual(new Date('2025-05-31T00:00:00Z'));
      expect(result.hoursInMonth).toBe(31 * 24);

      jest.useRealTimers();
    });
  });
});