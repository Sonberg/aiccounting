import axios from 'axios';
import { secret } from 'encore.dev/config';
import { Pagination, Payout, PayoutTransaction } from './types';

interface PayoutsResponse {
  pagination: Pagination;
  payouts: Payout[];
}

interface TransactionsResponse {
  pagination: Pagination;
  transactions: PayoutTransaction[];
}

const username = secret('KLARNA_USERNAME')();
const password = secret('KLARNA_PASSWORD')();

export const KlarnaRestClient = axios.create({
  baseURL: 'https://api.klarna.com',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Basic ${Buffer.from(`${username}:${password}`).toString(
      'base64'
    )}`,
  },
});

export const getPayouts = async (params: { from?: string }) => {
  const startDate = params.from
    ? new Date(params.from).toISOString()
    : undefined;

  const res = await KlarnaRestClient.get<PayoutsResponse>(
    `/settlements/v1/payouts`,
    {
      params: {
        start_date: startDate,
      },
    }
  );

  const payouts = [res.data];

  while (payouts[payouts.length - 1].pagination.next) {
    const nextUrl = payouts[payouts.length - 1].pagination.next!;
    const nextRes = await KlarnaRestClient.get<PayoutsResponse>(nextUrl);

    payouts.push(nextRes.data);
  }

  return payouts.flatMap((x) => x.payouts);
};

export const getPayoutTransactions = async (paymentReference: string) => {
  const res = await KlarnaRestClient.get<TransactionsResponse>(
    `settlements/v1/transactions?payment_reference=${paymentReference}`
  );

  return res.data;
};
