import { api } from 'encore.dev/api';
import { client, summarizeIfLarge } from './open-ai';
import { log } from 'console';

interface Params {
  entries: unknown[];
  entriesSource: string;
  transactionSource: string;
  transactions: unknown;
}

interface Response {
  data: {
    alreadyBooked: boolean;
    voucherNumber: string | null;
    paymentReference: string | null;
    reason: string;
  }[];
}

export const status = api<Params, Response>(
  { method: 'POST', path: '/core/status' },
  async (params) => {
    const compactEntries = await summarizeIfLarge(
      'bookkeeping entries',
      params.entries
    );

    const compactTransactions = await summarizeIfLarge(
      'transactions',
      params.transactions
    );

    const prompt = `
      Bookkeeping entries from ${params.entriesSource}:
      ${compactEntries}

      Now, list of transactions from ${params.transactionSource}:
      ${compactTransactions}

      Check if this settlement is already in the vouchers.
      A match can be:
      - Exact or fuzzy match of payment reference, OCR, or description.
      - Same amount within ±1 SEK and date within ±2 days.

      Reply in JSON with no explanation:
      {
        "alreadyBooked": true|false,
        "voucherNumber": "string|null",
        "paymentReference": "string",
        "reason": "short explanation"
      }
      `;

    log(prompt);

    const response = await client.responses.create({
      model: 'gpt-4.1-mini',
      input: prompt,
      temperature: 0,
    });

    log(response.output_text);

    return { data: JSON.parse(response.output_text!) };
  }
);
