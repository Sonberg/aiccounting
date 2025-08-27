import { api } from 'encore.dev/api';
import { client } from '../open-ai';
import { log } from 'console';
import { extractJson } from '@/utils/extractJson';

export type TransactionSuggestion = {
  voucherseries: string;
  date: string;
  rows: TransactionSuggestionRow[];
};

export type TransactionSuggestionRow = {
  account: number | string;
  debit: number | null;
  credit: number | null;
  description: string | null;
  explanation: string | null;
};

export interface SuggestParams {
  tenantId: number;
  fileNames: string[];
  transactionSource: string;
  transaction: unknown;
}

export interface SuggestResponse {
  data: TransactionSuggestion;
}

export const suggest = api<SuggestParams, SuggestResponse>(
  { method: 'POST', path: '/core/suggest' },
  async (params) => {
    const prompt = `
      You are an accounting assistant creating Fortnox vouchers.

      Transaction:
      ${JSON.stringify(params.transaction, null, 2)}

      Rules:
      - If transactionSource = Klarna, divide raw totals by 100 to get SEK.
        Examples: 10000 → 100.00 SEK, 9950 → 99.50 SEK.
      - Always balance debit and credit (sum(debit) = sum(credit)).
      - Never include empty rows.
      - Only use active accounts.
      - Prefer accounts used in the most recent vouchers for ${
        params.transactionSource
      }.
      - Follow Swedish bookkeeping best practices (BAS-kontoplan).
      - Use the attached vouchers as references, but only from ${
        params.transactionSource
      }.

      Return only valid JSON in this schema:
      {
        "date": "YYYY-MM-DD",
        "voucherseries": "string",
        "rows": [
          {
            "account": "string",
            "debit": number or null,
            "credit": number or null,
            "description": "string (account name only, no reference IDs)",
            "explanation": "string (short reason why this account is correct)"
          }
        ]
      }

      Before returning:
      - Verify debit = credit.
      - Verify accounts exist.
      - Verify no null-only rows.
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

    return { data: extractJson(response.output_text) };
  }
);
