import { log } from 'console';
import dayjs from 'dayjs';
import { api } from 'encore.dev/api';
import { core, fortnox, klarna } from '~encore/clients';

interface Params {
  from: string;
}

interface Response {
  data: unknown[];
}

export const get = api<Params, Response>(
  {
    method: 'POST',
    path: '/klarna-fortnox',
    expose: true,
  },
  async ({ from }) => {
    var payouts = await klarna.getPayouts({
      from,
    });

    var vouchers = await fortnox.getVouchers({
      from,
      to: dayjs().format('YYYY-MM-DD'),
    });

    const status = await core.status({
      entriesSource: 'Fortnox',
      entries: vouchers.data,
      transactionSource: 'Klarna settlement',
      transactions: payouts.data,
    });

    log(status);

    return status;
  }
);
