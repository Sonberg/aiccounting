import { api } from 'encore.dev/api';
import { syncTenant } from '../topics';
import { db } from '../database';
import { log } from 'console';

interface SyncTenantRequest {
  id: number;
}

export const sync = api<SyncTenantRequest>(
  {
    path: '/tenants/:id/sync',
    method: 'POST',
  },
  async (params) => {
    await syncTenant.publish({
      tenantId: params.id,
      jobId: await db.queryRow<{ id: number }>`
            INSERT INTO sync_jobs (tenant_id, status)
            VALUES (${params.id}, 'pending')
            RETURNING id;
        `.then((r) => r!.id),
    });
  }
);

interface SyncItemCreateRequest {
  jobId: number;
  source: 'fortnox' | 'klarna';
  sourceId: string | null;
  sourceType: string;
}

interface SyncItemCreateResponse {
  jobItemId: number;
}

export const syncItemStart = api<SyncItemCreateRequest, SyncItemCreateResponse>(
  {
    path: '/sync/:jobId/items',
    method: 'POST',
  },
  async ({ jobId, source, sourceId, sourceType }) => {
    const jobItemId = await db.queryRow<{ id: number }>`
      INSERT INTO sync_items (job_id, source, source_type, source_id, status, started_at)
      VALUES (${jobId}, ${source}, ${sourceType}, ${sourceId}, 'pending', NOW())
      ON CONFLICT (job_id, source, source_type, source_id) 
      DO UPDATE SET started_at = NOW(), status = 'pending', error = NULL, finished_at = NULL
      RETURNING id;
    `;

    return { jobItemId: jobItemId!.id };
  }
);

interface SyncItemUpdateRequest {
  jobId: number;
  jobItemId: number;
  status: 'success' | 'failed';
  error?: string;
}

export const syncItemEnd = api<SyncItemUpdateRequest>(
  {
    path: '/sync/:jobId/items/:jobItemId',
    method: 'PUT',
  },
  async ({ jobId, jobItemId, status, error }) => {
    const tx = await db.begin();

    try {
      await tx.exec`
        UPDATE sync_items
        SET status = ${status},
            error = ${error ?? null},
            finished_at = CASE WHEN ${status} IN ('success','failed') THEN NOW() ELSE NULL END
        WHERE id = ${jobItemId};
      `;

      // 2️⃣ Recalculate job status
      const result = await tx.queryRow<{ jobStatus: string }>`
        WITH counts AS (
          SELECT 
            COUNT(*) FILTER (WHERE status = 'pending') AS pending_count,
            COUNT(*) FILTER (WHERE status = 'failed') AS failed_count,
            COUNT(*) FILTER (WHERE status = 'success') AS success_count,
            COUNT(*) AS total_count
          FROM sync_items
          WHERE job_id = ${jobId}
        )
        UPDATE sync_jobs j
        SET status = CASE
            WHEN c.pending_count > 0 THEN 'pending'
            WHEN c.failed_count = 0 AND c.success_count = c.total_count THEN 'success'
            ELSE 'partial'
        END,
        finished_at = CASE
            WHEN c.pending_count = 0 THEN NOW()
            ELSE NULL
        END
        FROM counts c
        WHERE j.id = ${jobId}
        RETURNING j.status AS jobStatus;
      `;

      await tx.commit();

      log(result);
    } catch (error) {
      log(error);
      await tx.rollback();
      throw error;
    }
  }
);
