import { api } from 'encore.dev/api';
import { db } from '../../database';
import { log } from 'console';

export interface KlarnaFortnoxMatchRequest {
  klarnaPayoutId: number;
  tenantId: number;
}
export interface KlarnaFortnoxMatchResponse {
  data: number;
}

export const match = api<KlarnaFortnoxMatchRequest, KlarnaFortnoxMatchResponse>(
  { path: '/klarna-fortnox/match', method: 'POST' },
  async (params) => {
    const result = await db.queryAll`
    WITH target AS (
    SELECT embedding::vector as target_embedding
    FROM rag_embeddings
    WHERE tenant_id = ${params.tenantId}
        AND table_name = 'klarna_payouts'
        AND row_id = ${params.klarnaPayoutId}
    )
    SELECT re.table_name,
        re.row_id,
        re.summary,
        re.metadata,
        1 - (re.embedding::vector <=> target.target_embedding) AS similarity
    FROM rag_embeddings re, target
    WHERE re.tenant_id = ${params.tenantId}
    AND re.table_name = 'fortnox_vouchers'
    ORDER BY similarity DESC
    LIMIT 5;
    `;

    log(result);

    return {
      data: result.length,
    };
  }
);
