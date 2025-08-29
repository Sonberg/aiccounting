import { Topic } from 'encore.dev/pubsub';

export interface CreateEmbeddingParams {
  tenantId: number;
  tableName: 'fortnox_vouchers' | 'fortnox_accounts' | 'klarna_payouts';
  rowId: number;
  content: string;
  summary: string | null;
  metadata: Record<string, string | number>;
}

export const createEmbedding = new Topic<CreateEmbeddingParams>(
  'create-embedding',
  {
    deliveryGuarantee: 'at-least-once',
  }
);
