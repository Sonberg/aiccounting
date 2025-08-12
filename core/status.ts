import { api } from 'encore.dev/api';
import { client } from './open-ai';
import { log } from 'console';

interface CoreStatusParams {
  fileNames: string[];
  transactionSource: string;
  transactions: unknown;
}

interface CoreStatusResponse {
  data: TransactionStatus[];
}

export interface TransactionStatus {
  alreadyBooked: boolean;
  voucherNumber: string | null;
  paymentReference: string | null;
  reason: string;
}

export const status = api<CoreStatusParams, CoreStatusResponse>(
  { method: 'POST', path: '/core/status' },
  async (params) => {
    const prompt = `
      Bookkeeping entries from Fortnox is included as files

      Now, list of transactions from ${params.transactionSource}:
      ${JSON.stringify(params.transactions, null, 2)}

      Check if this settlement is already in the vouchers.
      A match can be:
      - Exact or fuzzy match of payment reference, OCR, or description.
      - Same amount within ±1 SEK and date within ±2 days.

      Reply in JSON:
      [{
        "alreadyBooked": true|false,
        "voucherNumber": "string|null",
        "paymentReference": "string",
        "reason": "short explanation"
      },...]
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

    return { data: JSON.parse(response.output_text!) };
  }
);
