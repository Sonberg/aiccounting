import { log } from 'console';
import { api } from 'encore.dev/api';
import { fortnox, klarna } from '~encore/clients';

interface Params {
  klarnaReference: string;
}

const voucherSeries = 'O';

export const suggest = api<Params>(
  {
    method: 'POST',
    path: '/klarna-fortnox/suggest',
    expose: true,
  },
  async ({ klarnaReference }) => {
    const payout = await klarna.getPayout({
      paymentReference: klarnaReference,
    });

    const transactions = await klarna.getPayoutTransactions({
      paymentReference: klarnaReference,
    });

    const simularVouchers = await fortnox.getVouchers({
      voucherSeries: voucherSeries,
    });

    const leftToFetch = 500 - simularVouchers.data.length;
    const referenceVouchers = await fortnox.getVouchers({
      limit: leftToFetch,
    });

    const prompt = `
      Here are previous bookkeeping entries:
      ${JSON.stringify(
        [...simularVouchers.data, ...referenceVouchers.data],
        null,
        2
      )}

      Now, here is a new Klarna settlement row:
      ${JSON.stringify(payout, null, 2)}

      And a list of transactions it contains:
      ${JSON.stringify(transactions.data, null, 2)}

      Suggest a Fortnox voucher according to Swedish bookkeeping best practices and similar past vouchers.
      Output JSON in the format:
      {
        "date": "...",
        "entries": [
          {"account": "...", "amount": ..., "description": "...", "vatCode": "..."}
        ]
      }

      `;
  }
);
