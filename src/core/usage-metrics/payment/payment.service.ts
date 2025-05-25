import { Injectable, Inject, LoggerService } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { InvoiceType } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../../infrastructure/database/prisma/prisma-service/prisma-service.service';

@Injectable()
export class PaymentService {
  constructor(
    private readonly httpService: HttpService,
    private readonly prisma: PrismaService,
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
  ) {}

  private generateUniqueTxRef(): string {
    return uuidv4();
  }

  async createInvoice(params: InvoiceType): Promise<string> {
    const headers = {
      Authorization: `Bearer ${process.env.CHAPA_TOKEN}`,
      'Content-Type': 'application/json',
    };

    const tx_ref = this.generateUniqueTxRef();

    const payload = {
      amount: params.amount,
      currency: 'ETB',
      email: params.email,
      first_name: params.first_name,
      tx_ref: tx_ref,
      callback_url: process.env.CHAPA_BACKEND_CALLBACK_URL,
      return_url: process.env.CHAPA_FRONTEND_RETURN_URL,
      customization: {
        title: 'PaaS Payment',
        description: 'Invoice for monthly usage',
      },
      meta: {
        hide_receipt: true,
      },
    };

    try {
      const response = await this.httpService.axiosRef.post(
        'https://api.chapa.co/v1/transaction/initialize',
        payload,
        { headers },
      );

      if (
        response.data.status === 'success' &&
        response.data.data?.checkout_url
      ) {
        await this.prisma.invoice.update({
          where: { id: params.id },
          data: {
            TxRef: tx_ref,
          },
        });
        return response.data.data.checkout_url;
      }

      this.logger.error(`Payment API error: ${response.data.message}`, {
        context: 'PaymentService',
        response: response.data,
      });
      throw new Error(response.data.message || 'Payment processing failed');
    } catch (error) {
      this.logger.error(`Payment failed: ${error.message}`, {
        context: 'PaymentService',
        error: error.response?.data || error.message,
        payload,
      });

      throw new Error(
        error.response?.data?.message || 'Payment processing failed',
      );
    }
  }

  // @Cron('0 */30 * * * *') // every 30 minutes generate a new url, since the chapa's url expires every 1 hour on production
  @Cron('0 */3 * * * *') // every 3min on dev
  async generatePaymentLink() {
    try {
      const pendingInvoices = await this.prisma.invoice.findMany({
        where: {
          status: { in: ['PENDING', 'GENERATED', 'FAILED'] },
        },
        include: { user: true },
      });

      for (const invoice of pendingInvoices) {
        try {
          if (invoice.dueDate >= new Date(new Date().toISOString())) {
            const paymentLink = await this.createInvoice({
              id: invoice.id,
              amount: invoice.amount.toString(),
              email: invoice.user.email,
              first_name: invoice.user.name || 'Customer',
            });

            await this.prisma.invoice.update({
              where: { id: invoice.id },
              data: {
                paymentLink,
                status: 'GENERATED',
              },
            });

            this.logger.log(
              `Generated payment link for invoice ${invoice.id} and the link is : `,
              paymentLink,
            );
          } else {
            await this.prisma.user.update({
              where: { id: invoice.userId },
              data: {
                status: 'SUSPENDED',
                suspendedAt: new Date(new Date().toISOString()),
              },
            });

            // stop the user containers
            
          }
        } catch (error) {
          this.logger.error(
            `Failed to generate payment for invoice ${invoice.id}: ${error.message}`,
          );
          await this.prisma.invoice.update({
            where: { id: invoice.id },
            data: {
              status: 'FAILED',
              updatedAt: new Date(new Date().toISOString()),
            },
          });
        }
      }
    } catch (error) {
      this.logger.error(
        `Payment link generation cron failed: ${error.message}`,
      );
    }
  }
}
