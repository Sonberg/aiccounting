import { Topic } from 'encore.dev/pubsub';

export interface CreateEmbeddingParams {}

export const createEmbedding = new Topic<CreateEmbeddingParams>(
  'create-embedding',
  {
    deliveryGuarantee: 'at-least-once',
  }
);
