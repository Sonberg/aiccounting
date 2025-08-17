import { Payout } from '@/klarna/endpoints/getPayouts';
import { api } from 'encore.dev/api';
import { klarna } from '~encore/clients';

interface KlarnaFortnoxGetParams {
  from: string;
}

interface KlarnaFortnoxGetResponse {
  data: Payout[];
}

export const get = api<KlarnaFortnoxGetParams, KlarnaFortnoxGetResponse>(
  {
    method: 'POST',
    path: '/klarna-fortnox',
    expose: true,
  },
  async ({ from }) => {
    return await klarna.getPayouts({
      from,
    });
  }
);
