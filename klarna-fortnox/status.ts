import { TransactionStatus } from '@/core/status';
import { filesByConvention } from '@/utils/filesByConvention';
import dayjs from 'dayjs';
import { api } from 'encore.dev/api';
import { core, klarna } from '~encore/clients';

interface KlarnaFortnoxStatusParams {
  from: string;
}

interface KlarnaFortnoxStatusResponse {
  data: TransactionStatus[];
}

export const status = api<
  KlarnaFortnoxStatusParams,
  KlarnaFortnoxStatusResponse
>(
  {
    method: 'POST',
    path: '/klarna-fortnox/status',
    expose: true,
  },
  async ({ from }) => {
    const payouts = await klarna.getPayouts({
      from,
    });

    const status = await core.status({
      fileNames: filesByConvention(
        1,
        'fortnox',
        'vouchers',
        dayjs(from).add(-1, 'month'),
        dayjs(),
        'pdf'
      ),
      transactionSource: 'Klarna settlement',
      transactions: payouts.data,
    });

    return status;
  }
);
