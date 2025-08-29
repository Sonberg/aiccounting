import { Subscription } from 'encore.dev/pubsub';
import { createEmbedding } from '../topics';
import { log } from 'console';
import { client } from '../open-ai';
import { db } from '../../database';

new Subscription(createEmbedding, 'process', {
  handler: async (params) => {
    const embeddingResponse = await client.embeddings.create({
      model: 'text-embedding-3-small',
      input: params.content,
    });

    const embeddingVector = embeddingResponse.data[0].embedding;
    const row = await db.queryRow<{ id: number }>`
      INSERT INTO rag_embeddings (
        tenant_id,
        table_name,
        row_id,
        embedding,
        summary,
        metadata
      ) VALUES (
        ${params.tenantId},
        ${params.tableName},
        ${params.rowId},
        ${embeddingVector},
        ${params.summary},
        ${params.metadata}
      )
      ON CONFLICT (table_name, row_id) DO UPDATE
        SET embedding = EXCLUDED.embedding,
            summary = EXCLUDED.summary,
            metadata = EXCLUDED.metadata
      RETURNING id;
    `;
    log('Embedding created');
  },
});
