import { Controller, Req, Get } from '@nestjs/common';
import { Public } from '../auth/public-strategy';
import { PaymentService } from './payment.service';
import { AuthenticatedRequest } from '../../utils/types/user.types';

@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}
  @Public()
  @Get('/chapa/callback')
  async chapaTransactionCallback(@Req() req) {
    const transactionReference = req.body?.trx_ref;
    await this.paymentService.verifyPayment(transactionReference);
  }

  @Get('/details')
  async getUserPaymentDetails(@Req() req: AuthenticatedRequest) {
    const userEmail = req.user.email;
    const details = await this.paymentService.getDetails(userEmail);
    return details;
  }

  @Get('/link')
  async getPaymentLinkFromDb(@Req() req: AuthenticatedRequest) {
    const userEmail = req.user.email;
    const invoice = await this.paymentService.getPaymentLink(userEmail);
    let paymentUrl;
    if (invoice) {
      paymentUrl = invoice.paymentLink;
    }
    return { paymentUrl };
  }
}
