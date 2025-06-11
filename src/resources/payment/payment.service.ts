import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { PrismaService } from '../../infrastructure/database/prisma/prisma-service/prisma-service.service';

import { PaymentStatusResponse } from './types';
import { ManageContainerService } from '../../core/container-setup/manage-containers/manage-containers.service';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly prisma: PrismaService,
    private readonly containerManagement: ManageContainerService,
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
      // await this.prisma.payment.deleteMany({
      //   where: {
      //     userId: user.id,
      //   },
      // });
      await this.prisma.billingRecord.create({
        data: {
          userId: user.id,
          amount: invoice.amount,
          status: 'PAID',
        },
      });

      await this.updateUserServices(user.id);
      this.logger.log(`Payment verified and user ${user.id} activated`);
    } catch (error) {
      this.logger.error(
        `Payment verification failed for tx_ref: ${tx_ref}`,
        error,
      );
      throw error;
    }
  }

  private async updateUserServices(userId: number) {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        role: 'ACTIVE',
      },
    });

    // activate if there is any stopped container for the user
    const projects = await this.prisma.project.findMany({
      where: {
        linkedByUserId: userId,
      },
    });

    for (const project of projects) {
      const activeDeployment = await this.prisma.deployment.findUnique({
        where: { id: project.activeDeploymentId },
      });
      await this.containerManagement.reStartStoppedContainer(
        '',
        activeDeployment,
      );
    }
  }

  async getDetails(userEmail: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: userEmail },
    });
    if (!user) return;

    const { firstDay, lastDay } = this.getPreviousMonthRange();

    const recentUsageCost = await this.prisma.dailyMetric.aggregate({
      where: {
        userId: user.id,
        date: {
          gte: new Date(firstDay.getTime()),
          lte: new Date(lastDay.getTime()),
        },
      },
      _sum: {
        amount: true,
      },
    });

    const previousBillingRecord = await this.prisma.billingRecord.findFirst({
      where: {
        userId: user.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const pendingInvoice = await this.prisma.invoice.findFirst({
      where: {
        userId: user.id,
        status: {
          in: ['PENDING', 'GENERATED', 'OVERDUE'],
        },
      },
    });

    const response: PaymentStatusResponse = {
      currentStatus: 'NOT-REACHED',
      previousAmount: previousBillingRecord?.amount ?? 0.0,
      currentPaymentAmount: recentUsageCost._sum.amount ?? 0.0,
      nextPaymentDate: new Date(
        new Date().getFullYear(),
        new Date().getMonth() + 1,
        1,
      ),
    };

    if (pendingInvoice) {
      switch (pendingInvoice.status) {
        case 'GENERATED':
          response.currentPaymentAmount = pendingInvoice.amount;
          response.currentStatus = 'PENDING';
          break;
        case 'OVERDUE':
          response.currentPaymentAmount = pendingInvoice.amount;
          response.currentStatus = 'OVERDUE';
          break;
        default:
          response.currentStatus = 'NOT-REACHED';
      }
      response.paymentLink = pendingInvoice.paymentLink;
    }

    return response;
  }

  async getPaymentLink(userEmail: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: userEmail },
    });
    if (!user) return;

    return await this.prisma.invoice.findFirst({
      where: {
        userId: user.id,
        status: {
          in: ['GENERATED', 'OVERDUE'],
        },
      },
    });
  }

  // ON production
  private getPreviousMonthRange() {
    const now = new Date();
    const firstDay = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1),
    );
    const lastDay = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 0),
    );
    return {
      firstDay,
      lastDay,
      hoursInMonth: lastDay.getDate() * 24,
    };
  }

  // On dev
  // private getPreviousMonthRange() {
  //   const now = new Date();
  //   const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000);

  //   return {
  //     firstDay: new Date(tenMinutesAgo.toISOString()),
  //     lastDay: new Date(now.toISOString()),
  //     hoursInMonth: 30 / 60,
  //   };
  // }
}
