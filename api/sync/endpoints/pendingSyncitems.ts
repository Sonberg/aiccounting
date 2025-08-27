import { api } from 'encore.dev/api';
import { db } from '../database';

interface PendingSyncItem {
  id: number;
  job_id: number;
  source: string;
  source_type: string;
  source_id: string;
  status: string;
  finished_at: string | null;
  job_status: string;
}

interface PendingSyncRequest {
  tenantId: number;
}

interface PendingSyncResponse {
  items: PendingSyncItem[];
}

export const pendingSyncItems = api<PendingSyncRequest, PendingSyncResponse>(
  {
    path: '/sync/pending',
    method: 'GET',
  },
  async ({ tenantId }) => {
    const items = await db.query<PendingSyncItem>`
      WITH latest_runs AS (
          SELECT DISTINCT ON (i.source, i.source_type, i.source_id)
              i.id,
              i.job_id,
              i.source,
              i.source_type,
              i.source_id,
              i.status,
              i.finished_at
          FROM sync_items i
          JOIN sync_jobs j ON j.id = i.job_id
          WHERE j.tenant_id = ${tenantId}
          ORDER BY i.source, i.source_type, i.source_id, i.started_at DESC
      )
      SELECT lr.*, j.status AS job_status
      FROM latest_runs lr
      JOIN sync_jobs j ON j.id = lr.job_id
      WHERE lr.status != 'success'
      ORDER BY lr.source, lr.source_type, lr.source_id;
    `;

    return { items } as any;
  }
);
