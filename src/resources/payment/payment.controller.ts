import { Controller, Req, Get, Post, Res } from '@nestjs/common';
import { Public } from '../auth/public-strategy';
import { StatusService } from './status/status.service';
import { AuthenticatedRequest } from '../../utils/types/user.types';

@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentStatusService: StatusService) {}
  @Public()
  @Post('/chapa/callback')
  async chapaTransactionCallback(@Req() req) {
    // TODO: Verify for success or failure
    const transactionReference = req.body?.trx_ref;
    await this.paymentStatusService.verifyPayment(transactionReference);
  }

  @Get('/details')
  async getUserPaymentDetails(@Req() req: AuthenticatedRequest) {
    const userEmail = req.user.email;
    const details = await this.paymentStatusService.getDetails(userEmail);
    return details;
  }

  @Get('/link')
  async getPaymentLinkFromDb(@Req() req: AuthenticatedRequest) {
    const userEmail = req.user.email;
    const invoice = await this.paymentStatusService.getPaymentLink(userEmail);
    let paymentUrl;
    if (invoice) {
      paymentUrl = invoice.paymentLink;
    }

    // return res.redirect(paymentUrl);
    console.log('the link for the frontend is , ', paymentUrl);
    return { paymentUrl };
  }
}
