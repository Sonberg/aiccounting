import { api } from 'encore.dev/api';
import { KlarnaRestClient } from '../client';

export interface Pagination {
  count: number;
  next: string | null;
  offset: number;
  prev: string | null;
  total: number;
}

export interface PayoutTransaction {
  amount: number;
  capture_date?: Date;
  customer_vat?: {
    tax_amount: number;
    tax_rate: number;
  }[];
  currency_code: 'SEK' | string;
  detailed_type: 'PURCHASE_RETURN' | string;
  initial_payment_method_number_of_installments?: number;
  initial_payment_method_type?: 'invoice' | string;
  merchant_id: string;
  order_id?: string | null;
  payment_reference: string;
  payout: string;
  purchase_country?: 'SE' | string;
  refund_id?: string;
  sale_date?: Date;
  short_order_id?: string;
  type: 'RETURN' | string;
  vat_amount: number;
}

export interface PayoutTransactionsResponse {
  pagination: Pagination;
  transactions: PayoutTransaction[];
}

interface GetPayoutTransactionRequest {
  paymentReference: string;
}

interface GetPayoutTransactionResponse {
  data: PayoutTransaction[];
}

export const getPayoutTransactions = api<
  GetPayoutTransactionRequest,
  GetPayoutTransactionResponse
>(
  {
    path: '/klarna/payouts/:paymentReference/transactions',
    method: 'GET',
    expose: false,
  },
  async (params) => {
    const { data } = await KlarnaRestClient.get<PayoutTransactionsResponse>(
      `settlements/v1/transactions?payment_reference=${params.paymentReference}`
    );

    return {
      data: data.transactions,
    };
  }
);
