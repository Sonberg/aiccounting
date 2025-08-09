import { api } from 'encore.dev/api';
import { core, fortnox, klarna } from '~encore/clients';

interface Params {
  paymentReference: string;
}

const voucherSeries = 'O';

export const suggest = api<Params>(
  {
    method: 'POST',
    path: '/klarna-fortnox/suggest',
    expose: true,
  },
  async ({ paymentReference }) => {
    const payout = await klarna.getPayout({
      paymentReference,
    });

    const transactions = await klarna.getPayoutTransactions({
      paymentReference,
    });

    const simularVouchers = await fortnox.getVouchers({
      voucherSeries,
    });

    const leftToFetch = 0 - simularVouchers.data.length;
    const referenceVouchers = await fortnox.getVouchers({
      limit: Math.max(leftToFetch, 0),
    });

    const result = await core.suggest({
      tenantId: 1,
      referenceSource: 'Fortnox',
      references: [...simularVouchers.data, ...referenceVouchers.data],
      transactionSource: 'Klarna settlement',
      transaction: {
        payout: payout,
        transactions: transactions,
      },
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
