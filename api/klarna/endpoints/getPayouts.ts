import { api } from 'encore.dev/api';
import { KlarnaRestClient } from '@/klarna/client';
import { Pagination, Payout } from '../types';

interface KlarnaResponse {
  pagination: Pagination;
  payouts: Payout[];
}

interface GetPayoutsParams {
  from?: string;
}

interface GetPayoutsResponse {
  data: Payout[];
}

export const getPayouts = api<GetPayoutsParams, GetPayoutsResponse>(
  {
    expose: true,
    path: '/klarna/payouts',
    method: 'GET',
  },
  async (params) => {
    const startDate = params.from
      ? new Date(params.from).toISOString()
      : undefined;

    const res = await KlarnaRestClient.get<KlarnaResponse>(
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
      const nextRes = await KlarnaRestClient.get<KlarnaResponse>(nextUrl);

      payouts.push(nextRes.data);
    }

    return {
      data: payouts.flatMap((x) => x.payouts),
    };
  }
);
