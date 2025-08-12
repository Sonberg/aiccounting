import { api } from 'encore.dev/api';
import { client } from './open-ai';
import { log } from 'console';

interface Params {
  tenantId: number;
  fileNames: string[];
  transactionSource: string;
  transaction: unknown;
}

export interface TransactionSuggestion {
  voucherseries: string;
  date: string;
  rows: TransactionSuggestionRow[];
}

export interface TransactionSuggestionRow {
  account: string | number;
  debit: number;
  credit: number;
  description: string;
}

interface Response {
  data: TransactionSuggestion;
}

export const suggest = api<Params, Response>(
  { method: 'POST', path: '/core/suggest' },
  async (params) => {
    const prompt = `
      Here is a new ${params.transactionSource} transaction:
      ${JSON.stringify(params.transaction, null, 2)}

      Suggest a Fortnox voucher according to Swedish bookkeeping best practices and similar past vouchers.
      Reply in JSON:
      {
        "date": "...",
        "voucherseries": "Most sutable voucherseries for transaction from ${params.transactionSource}",
        "rows": [
          {
          "account": "...",
          "debit": ...,
          "credit": ...,
          "description": "..."
          }
        ]
      }
      `;

    const files = await client.files.list();
    const response = await client.responses.create({
      model: 'gpt-4.1-mini',
      input: [
        {
          role: 'user',
          content: [
            ...files.data
              .filter((x) => params.fileNames.includes(x.filename))
              .map((x) => ({
                type: 'input_file' as const,
                file_id: x.id,
              })),
            {
              type: 'input_text',
              text: prompt,
            },
          ],
        },
      ],
    });

    log(response.output_text);

    return { data: JSON.parse(response.output_text!) };
  }
);
