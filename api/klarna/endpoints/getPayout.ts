import { api } from 'encore.dev/api';
import { KlarnaRestClient } from '@/klarna/client';
import { Payout } from './getPayouts';

export interface GetPayoutRequest {
  paymentReference: string;
}

export const getPayout = api<GetPayoutRequest, Payout>(
  {
    expose: true,
    path: '/klarna/payouts/:paymentReference',
    method: 'GET',
  },
  async (params) => {
    const { data } = await KlarnaRestClient.get<Payout>(
      `/settlements/v1/payouts/${params.paymentReference}`
    );

    return data;
  }
);
