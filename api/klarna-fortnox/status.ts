import { fileByConvention } from '@/utils/filesByConvention';
import dayjs from 'dayjs';
import { api } from 'encore.dev/api';
import { core, klarna } from '~encore/clients';
import { TransactionStatus } from '../core/endpoints/match';

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

    const status = await core.match({
      fileNames: fileByConvention.fromMonthRange(
        1,
        'fortnox',
        'vouchers',
        dayjs(from),
        dayjs(),
        'pdf'
      ),
      transactionSource: 'Klarna settlement',
      transactions: payouts.data,
    });

    return {
      data: payouts.data.map(
        (x) =>
          status.data.find(
            (y) => x.payment_reference === y.paymentReference
          ) ?? {
            paymentReference: x.payment_reference,
            voucherSeries: null,
            voucherNumber: null,
            alreadyBooked: false,
            state: 'NoMatch',
            reason: 'No marching voucher found',
          }
      ),
    };
  }
);
