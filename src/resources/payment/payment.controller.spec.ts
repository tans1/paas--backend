import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { AuthenticatedRequest } from '../../utils/types/user.types';
import { Request } from 'express';

describe('PaymentController', () => {
  let controller: PaymentController;
  let paymentService: jest.Mocked<PaymentService>;

  // Mock data
  const mockUser = { email: 'test@example.com', userId: '123' };
  const mockPaymentDetails = {
    amount: 1000,
    currency: 'ETB',
    status: 'completed',
    date: new Date()
  };
  const mockInvoice = {
    paymentLink: 'https://payment.example.com/checkout/xyz123',
    expiresAt: new Date(Date.now() + 3600000)
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaymentController],
      providers: [
        {
          provide: PaymentService,
          useValue: {
            verifyPayment: jest.fn().mockResolvedValue(true),
            getDetails: jest.fn().mockResolvedValue(mockPaymentDetails),
            getPaymentLink: jest.fn().mockResolvedValue(mockInvoice),
          },
        },
      ],
    }).compile();

    controller = module.get<PaymentController>(PaymentController);
    paymentService = module.get<PaymentService>(PaymentService) as jest.Mocked<PaymentService>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should be defined', () => {
      expect(controller).toBeDefined();
    });
  });

  describe('chapaTransactionCallback', () => {
    it('should successfully verify payment with valid transaction reference', async () => {
      const mockReq = { body: { trx_ref: 'chapa-ref-xyz123' } };

      await controller.chapaTransactionCallback(mockReq);

      expect(paymentService.verifyPayment).toHaveBeenCalledWith('chapa-ref-xyz123');
      expect(paymentService.verifyPayment).toHaveBeenCalledTimes(1);
    });

    it('should handle missing transaction reference', async () => {
      const mockReq = { body: {} };

      await controller.chapaTransactionCallback(mockReq);

      expect(paymentService.verifyPayment).toHaveBeenCalledWith(undefined);
    });

    it('should handle service errors gracefully', async () => {
      paymentService.verifyPayment.mockRejectedValueOnce(new Error('Verification failed'));
      const mockReq = { body: { trx_ref: 'invalid-ref' } };

      await expect(controller.chapaTransactionCallback(mockReq)).resolves.not.toThrow();
    });
  });

  describe('getUserPaymentDetails', () => {
    it('should return payment details for authenticated user', async () => {
      const mockReq = { user: mockUser } as Partial<AuthenticatedRequest> as AuthenticatedRequest;

      const result = await controller.getUserPaymentDetails(mockReq);

      expect(paymentService.getDetails).toHaveBeenCalledWith('test@example.com');
      expect(result).toEqual(mockPaymentDetails);
    });

    it('should throw BadRequestException if user email is missing', async () => {
      const mockReq = { user: {} } as Partial<AuthenticatedRequest> as AuthenticatedRequest;

      await expect(controller.getUserPaymentDetails(mockReq))
        .rejects.toThrow(BadRequestException);
    });

    it('should handle service errors', async () => {
      paymentService.getDetails.mockRejectedValueOnce(new Error('Database error'));
      const mockReq = { user: mockUser } as Partial<AuthenticatedRequest> as AuthenticatedRequest;

      await expect(controller.getUserPaymentDetails(mockReq))
        .rejects.toThrow('Database error');
    });
  });

  describe('getPaymentLinkFromDb', () => {
    it('should return payment link when available', async () => {
      const mockReq = { user: mockUser } as Partial<AuthenticatedRequest> as AuthenticatedRequest;

      const result = await controller.getPaymentLinkFromDb(mockReq);

      expect(paymentService.getPaymentLink).toHaveBeenCalledWith('test@example.com');
      expect(result).toEqual({ paymentUrl: mockInvoice.paymentLink });
    });

    it('should return empty paymentUrl when no invoice exists', async () => {
      paymentService.getPaymentLink.mockResolvedValueOnce(null);
      const mockReq = { user: mockUser } as Partial<AuthenticatedRequest> as AuthenticatedRequest;

      const result = await controller.getPaymentLinkFromDb(mockReq);

      expect(result).toEqual({ paymentUrl: undefined });
    });

    it('should throw BadRequestException if user email is missing', async () => {
      const mockReq = { user: {} } as Partial<AuthenticatedRequest> as AuthenticatedRequest;

      await expect(controller.getPaymentLinkFromDb(mockReq))
        .rejects.toThrow(BadRequestException);
    });

    it('should handle service errors', async () => {
      paymentService.getPaymentLink.mockRejectedValueOnce(new Error('Network error'));
      const mockReq = { user: mockUser } as Partial<AuthenticatedRequest> as AuthenticatedRequest;

      await expect(controller.getPaymentLinkFromDb(mockReq))
        .rejects.toThrow('Network error');
    });
  });
});
