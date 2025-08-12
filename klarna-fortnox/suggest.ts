import { TransactionSuggestion } from '@/core/suggest';
import { filesByConvention } from '@/utils/filesByConvention';
import dayjs from 'dayjs';
import { api } from 'encore.dev/api';
import { core, klarna } from '~encore/clients';

interface KlarnaFortnoxSuggestParams {
  paymentReference: string;
}

interface KlarnaFortnoxSuggestResponse {
  data: TransactionSuggestion;
}

export const suggest = api<
  KlarnaFortnoxSuggestParams,
  KlarnaFortnoxSuggestResponse
>(
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

    const result = await core.suggest({
      tenantId: 1,
      fileNames: filesByConvention(
        1,
        'fortnox',
        'vouchers',
        dayjs(payout.payout_date).add(-2, 'year'),
        dayjs(),
        'pdf'
      ),
      transactionSource: 'Klarna settlement',
      transaction: {
        payout: payout,
        transactions: transactions,
      },
    });

    return {
      data: result.data,
    };
  }
);
