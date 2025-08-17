import { api } from 'encore.dev/api';
import { client } from './open-ai';

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
  voucherSeries: string | null;
  paymentReference: string | null;
  reason: string;
  confidence: string;
}

export const status = api<CoreStatusParams, CoreStatusResponse>(
  { method: 'POST', path: '/core/status' },
  async (params) => {
    const prompt = `
    Bookkeeping entries from Fortnox are included as files.

    Transactions from ${params.transactionSource}:
    ${JSON.stringify(params.transactions, null, 2)}

    Rules to detect already-booked settlements:
    - Amount must match exactly (for Klarna, divide by 100 first: 10000 → 100 SEK).
    - Date must match exactly (same day, month, and year). 
    - If the date does not match, the transaction CANNOT be considered a match, even if amount or reference are similar.
    - Payment reference matching:
      - Exact match or fuzzy match (ignore case, allow 1–2 character typo, partial match ≥ 80% chars).
    - Only consider vouchers in the most common voucher series for ${
      params.transactionSource
    }.

    Assign confidence based on how certain you are that the transaction is already booked as a voucher:
    - High: Very strong evidence of a match (exact or near-exact across key fields).
    - Medium: Reasonable evidence but not certain (partial match, or one field uncertain).
    - Low: Weak evidence or no reliable match.

    For EACH transaction in the input list, return one result object.  
    Always return the same number of objects as the number of input transactions, even if no match is found.  

    If no match is found, set:
    - alreadyBooked = false
    - voucherNumber = null
    - voucherSeries = null
    - reason = "No matching voucher found"
    - confidence = "Low"

    Return ONLY valid JSON array, with one object per transaction, in this schema:
    [
      {
        "alreadyBooked": true|false,
        "voucherNumber": "string or null",
        "voucherSeries": "string or null",
        "paymentReference": "string or null",
        "reason": "short explanation (include matching voucherNumber if found)",
        "confidence": "High|Medium|Low"
      }
    ]
    `;

    const files = await client.files.list();
    console.log('files fetched');

    const response = await client.responses.create({
      model: 'gpt-4o-mini',
      input: [
        {
          role: 'user',
          content: []??[
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

    const data = JSON.parse(response.output_text!) as TransactionStatus[];

    return { data };
  }
);
