export interface PaymentStatusResponse {
  currentStatus: 'PENDING' | 'PAID' | 'OVERDUE' | 'NOT-REACHED';
  currentPaymentAmount?: number;
  previousAmount?: number;
  nextPaymentDate?: Date;
  paymentLink?: string;
}
