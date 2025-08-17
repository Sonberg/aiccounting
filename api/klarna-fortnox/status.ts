import { TransactionStatus } from '@/core/status';
import { fileByConvention } from '@/utils/filesByConvention';
import dayjs from 'dayjs';
import { api } from 'encore.dev/api';
import { core, fortnox, klarna } from '~encore/clients';

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
            confidence: 'High',
            reason: 'No marching voucher found',
          }
      ),
    };
  }
);
