import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { PrismaService } from '../../../infrastructure/database/prisma/prisma-service/prisma-service.service';

import { PaymentStatusResponse } from '../types';

@Injectable()
export class StatusService {
  private readonly logger = new Logger(StatusService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly prisma: PrismaService,
  ) {}

  async verifyPayment(tx_ref: string) {
    try {
      const headers = {
        Authorization: `Bearer ${process.env.CHAPA_TOKEN}`,
        'Content-Type': 'application/json',
      };

      const response = await this.httpService.axiosRef.get(
        `https://api.chapa.co/v1/transaction/verify/${tx_ref}`,
        { headers },
      );

      const data = response.data?.data;
      const status = response.data?.status;

      if (!data || status !== 'success' || data.status !== 'success') {
        this.logger.warn(`Transaction not successful for tx_ref: ${tx_ref}`);
        return;
      }

      const invoice = await this.prisma.invoice.findFirst({
        where: { TxRef: tx_ref },
      });

      if (!invoice) {
        this.logger.error(`Invoice not found for tx_ref: ${tx_ref}`);
        return;
      }

      const user = await this.prisma.user.findUnique({
        where: { id: invoice.userId },
      });

      if (!user) {
        this.logger.error(`User not found for invoice ID: ${invoice.id}`);
        return;
      }

      await this.prisma.invoice.update({
        where: { id: invoice.id },
        data: {
          status: 'PAID',
          updatedAt: new Date(),
        },
      });

      // clear all and track fresh daily payment amount, once the previous is paid
      await this.prisma.payment.deleteMany({
        where: {
          userId: user.id,
        },
      });

      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          role: 'ACTIVE',
        },
      });

      // activate if there is any stopped container for the user

      this.logger.log(`Payment verified and user ${user.id} activated`);
    } catch (error) {
      this.logger.error(
        `Payment verification failed for tx_ref: ${tx_ref}`,
        error,
      );
      throw error;
    }
  }

  async getDetails(userEmail: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: userEmail },
    });
    if (!user) return;

    const [pendingInvoice, paymentDetails] = await Promise.all([
      this.prisma.invoice.findFirst({
        where: {
          userId: user.id,
          status: {
            in: ['PENDING', 'GENERATED'],
          },
        },
      }),
      this.prisma.payment.findFirst({
        where: { userId: user.id, status: 'PENDING' },
      }),
    ]);

    const response: PaymentStatusResponse = {
      currentStatus: 'NOT-REACHED',
    };

    if (pendingInvoice) {
      response.currentStatus =
        pendingInvoice.status === 'GENERATED'
          ? 'PENDING'
          : (pendingInvoice.status as 'PENDING' | 'OVERDUE');
      response.paymentLink = pendingInvoice.paymentLink;
    }

    if (paymentDetails) {
      const now = new Date();
      const nextDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);

      response.currentPaymentAmount = paymentDetails.amount;
      response.previousAmount = paymentDetails.recentPaidAmount || 0;
      response.nextPaymentDate = nextDate;
    }

    return response;
  }

  async getPaymentLink(userEmail: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: userEmail },
    });
    if (!user) return;

    return await this.prisma.invoice.findFirst({
      where: { userId: user.id, status: 'GENERATED' },
    });
  }
}
