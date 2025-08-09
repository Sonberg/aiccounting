import { api } from 'encore.dev/api';
import { client } from './open-ai';
import { log } from 'console';

interface Params {
  tenantId: number;
  references: unknown[];
  referenceSource: string;
  transactionSource: string;
  transaction: unknown;
}

interface Response {
  data: string;
}

export const suggest = api<Params, Response>(
  { method: 'POST', path: '/core/suggest' },
  async (params) => {
    const prompt = `
      Here are previous bookkeeping entries from ${params.referenceSource}:
      ${JSON.stringify(params.references, null, 2)}

      Now, here is a new ${params.transactionSource} row:
      ${JSON.stringify(params.transaction, null, 2)}

      Suggest a Fortnox voucher according to Swedish bookkeeping best practices and similar past vouchers.
      Output JSON in the format:
      {
        "date": "...",
        "entries": [
          {"account": "...", "amount": ..., "description": "...", "vatCode": "..."}
        ]
      }

       Reply ONLY in JSON with no explanation.
      `;

    const response = await client.responses.create({
      model: 'gpt-4.1-mini',
      input: prompt,
      temperature: 0,
    });

    log(response.output_text);

    return { data: JSON.parse(response.output_text!) };
  }
);
