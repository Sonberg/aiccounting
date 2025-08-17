import { api } from 'encore.dev/api';
import { KlarnaRestClient } from '@/klarna/client';

export interface Pagination {
  count: number;
  next: string | null;
  offset: number;
  prev: string | null;
  total: number;
}

export interface Payout {
  currency_code: string;
  currency_code_of_registration_country?: string | null;
  merchant_id: string;
  merchant_settlement_type: string;
  payment_reference: string;
  payout_date: string;
  transactions: string;
  totals: PayoutTotals;
}

export interface PayoutTotals {
  charge_amount: number;
  closing_debt_balance_amount: number;
  commission_amount: number;
  credit_amount: number;
  deposit_amount: number;
  fee_amount: number;
  fee_correction_amount: number;
  fee_refund_amount: number;
  holdback_amount: number;
  opening_debt_balance_amount: number;
  release_amount: number;
  repay_amount: number;
  return_amount: number;
  reversal_amount: number;
  sale_amount: number;
  settlement_amount: number;
  tax_amount: number;
  tax_refund_amount: number;
}

export interface PayoutsResponse {
  pagination: Pagination;
  payouts: Payout[];
}

export interface GetPayoutsParams {
  from: string;
}

export interface GetPayoutsResponse {
  data: Payout[];
}

export const getPayouts = api<GetPayoutsParams, GetPayoutsResponse>(
  {
    expose: true,
    path: '/klarna/payouts',
    method: 'GET',
  },
  async (params) => {
    const startDate = encodeURIComponent(new Date(params.from).toISOString());
    const res = await KlarnaRestClient.get<PayoutsResponse>(
      `/settlements/v1/payouts?start_date=${startDate}`
    );

    const payouts = [res.data];

    while (payouts[payouts.length - 1].pagination.next) {
      const nextUrl = payouts[payouts.length - 1].pagination.next!;
      const nextRes = await KlarnaRestClient.get<PayoutsResponse>(nextUrl);

      payouts.push(nextRes.data);
    }

    return {
      data: payouts.flatMap((x) => x.payouts),
    };
  }
);
