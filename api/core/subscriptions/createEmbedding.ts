import { Subscription } from 'encore.dev/pubsub';
import { createEmbedding } from '../topics';
import { log } from 'console';
import { client } from '../open-ai';
import { db } from '../../database';

function toPgVector(values: number[]): string {
  return `'[${values.join(',')}]'`;
}

new Subscription(createEmbedding, 'process', {
  handler: async (params) => {
    const embeddingResponse = await client.embeddings.create({
      model: 'text-embedding-3-small',
      input: params.content,
    });

    const embeddingVector = embeddingResponse.data[0].embedding;
    const embedding = toPgVector(embeddingVector);
    const row = await db.rawExec(
      `
      INSERT INTO rag_embeddings (
        tenant_id,
        table_name,
        row_id,
        embedding,
        summary,
        metadata
      ) VALUES (
        $1,
        $2,
        $3,
        ${embedding},
        $4,
        $5
      )
      ON CONFLICT (table_name, row_id) DO UPDATE
        SET embedding = EXCLUDED.embedding,
            summary = EXCLUDED.summary,
            metadata = EXCLUDED.metadata
      RETURNING id;
    `,
      params.tenantId,
      params.tableName,
      params.rowId,
      params.summary,
      params.metadata
    );
    log('Embedding created');
  },
});
