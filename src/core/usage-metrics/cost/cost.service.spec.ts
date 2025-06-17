import { CostService } from './cost.service';
import { HttpService } from '@nestjs/axios';
import { PrismaService } from '../../../infrastructure/database/prisma/prisma-service/prisma-service.service';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { ManageContainerService } from '../../container-setup/manage-containers/manage-containers.service';
import { of, throwError } from 'rxjs';

describe('CostService', () => {
  let service: CostService;
  let httpService: Partial<HttpService>;
  let prisma: Partial<PrismaService>;
  let logger: any;
  let containerManagement: Partial<ManageContainerService>;

  const OLD_ENV = process.env;

  beforeEach(() => {
    process.env = {
      ...OLD_ENV,
      CHAPA_TOKEN: 'token',
      CHAPA_BACKEND_CALLBACK_URL: 'https://cb',
      CHAPA_FRONTEND_RETURN_URL: 'https://ret',
    };

    httpService = {
      axiosRef: { post: jest.fn() },
    };
    logger = { error: jest.fn(), log: jest.fn() };
    containerManagement = { stop: jest.fn().mockResolvedValue(undefined) };

    service = new CostService(
      httpService as HttpService,
      prisma as PrismaService,
      logger,
      containerManagement as ManageContainerService,
    );
  });

  afterEach(() => {
    process.env = OLD_ENV;
  });

  describe('createInvoice', () => {
    const params = {
      id: '1',
      amount: '100',
      email: 'a@b.com',
      first_name: 'Alice',
    };

    it('returns checkout_url on success and updates invoice', async () => {
      const mockUrl = 'https://pay';
      (httpService.axiosRef.post as jest.Mock).mockResolvedValue({
        data: { status: 'success', data: { checkout_url: mockUrl } },
      });

      const url = await service.createInvoice(params);

      expect(httpService.axiosRef.post).toHaveBeenCalledWith(
        'https://api.chapa.co/v1/transaction/initialize',
        expect.objectContaining({
          amount: '100',
          email: 'a@b.com',
          first_name: 'Alice',
          tx_ref: expect.any(String)
        }),
        { headers: expect.objectContaining({
            Authorization: 'Bearer token',
            'Content-Type': 'application/json',
          }),
        },
      );
      expect(prisma.invoice!.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { TxRef: expect.any(String) },
      });
      expect(url).toBe(mockUrl);
    });

    it('throws on API error status and logs error', async () => {
      (httpService.axiosRef.post as jest.Mock).mockResolvedValue({
        data: { status: 'error', message: 'Payment processing failed' },
      });

      await expect(service.createInvoice(params)).rejects.toThrow('Payment processing failed');
      expect(logger.error).toHaveBeenCalledWith(
        'Payment API error: Payment processing failed',
        expect.any(Object),
      );
    });

    it('throws on HTTP exception and logs error', async () => {
      const error = { response: { data: { message: 'bad' } }, message: 'bad' };
      (httpService.axiosRef.post as jest.Mock).mockRejectedValue(error);
      const expectedError =
      {
        "context": "PaymentService",
        "error": {
          "message": "bad"
        },
        "payload": {
          "amount": "100",
          "callback_url": "https://cb",
          "currency": "ETB",
          "customization": {
            "description": "Invoice for monthly usage",
            "title": "PaaS Payment"
          },
          "email": "a@b.com",
          "first_name": "Alice",
          "meta": {
            "hide_receipt": true
          },
          "return_url": "https://ret",
          "tx_ref": expect.any(String)  // dynamic value matcher
        }
      }
      await expect(service.createInvoice(params)).rejects.toThrow('bad');
      expect(logger.error).toHaveBeenCalledWith(
        'Payment failed: bad',
        expect.objectContaining(expectedError),
      );
    });
  });
});
