import { api } from 'encore.dev/api';
import { db } from '../database';

interface SyncItemCreateRequest {
  jobId: number;
  source: 'fortnox' | 'klarna';
  sourceId: string | null;
  sourceType: string;
}

interface SyncItemCreateResponse {
  jobItemId: number;
}

export const startSyncItem = api<SyncItemCreateRequest, SyncItemCreateResponse>(
  {
    path: '/sync/:jobId/items/start',
    method: 'POST',
  },
  async ({ jobId, source, sourceId, sourceType }) => {
    const jobItem = await db.queryRow<{ id: number }>`
          INSERT INTO sync_items (job_id, source, source_type, source_id, status, started_at)
          VALUES (${jobId}, ${source}, ${sourceType}, ${sourceId}, 'pending', NOW())
          ON CONFLICT (job_id, source, source_type, source_id)
          DO UPDATE SET started_at = NOW(), status = 'pending', error = NULL, finished_at = NULL
          RETURNING id AS id, (xmax = 0) AS "isNew"
    `;

    return { jobItemId: jobItem!.id };
  }
);
