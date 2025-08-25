import { api } from 'encore.dev/api';
import { syncTenant } from '../topics';
import { db } from '../database';
import { Subscription, Topic } from 'encore.dev/pubsub';
import { sleep } from '../../utils/sleep';

interface JobStatus {
  jobId: number;
  updatedAt: Date | null;
}

export const topic = new Topic<JobStatus>('job-status', {
  deliveryGuarantee: 'at-least-once',
});

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
            finished_at = NOW()
        WHERE id = ${jobItemId};
      `;

      const result = await tx.queryRow<{ updated_at: Date }>`
        UPDATE sync_jobs
        SET updated_at = NOW()
        WHERE id = ${jobId}
        RETURNING updated_at;
      `;

      await tx.commit();

      if (result?.updated_at) {
        await topic.publish({
          updatedAt: result.updated_at,
          jobId,
        });
      }
    } catch (error) {
      await tx.rollback();
      throw error;
    }
  }
);

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
    path: '/tenants/:tenantId/sync/pending',
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

const _ = new Subscription(topic, 'process', {
  handler: async (params) => {
    await sleep(2000);

    const job = await db.queryRow<{ updated_at: Date }>`
      SELECT updated_at
      FROM sync_jobs
      WHERE id = ${params.jobId}
    `;

    if (job?.updated_at?.toISOString() !== params.updatedAt?.toISOString()) {
      return;
    }

    await db.exec`
    UPDATE sync_jobs j
        SET
          pending_count = counts.pending_count,
          success_count = counts.success_count,
          failed_count  = counts.failed_count,
          total_count   = counts.total_count,
          status = CASE
            WHEN counts.pending_count > 0 THEN 'pending'
            WHEN counts.failed_count = 0 AND counts.success_count = counts.total_count THEN 'success'
            ELSE 'partial'
          END,
          finished_at = CASE
            WHEN counts.pending_count = 0 THEN NOW()
            ELSE NULL
          END
        FROM (
          SELECT
            job_id,
            COUNT(*) FILTER (WHERE status = 'pending') AS pending_count,
            COUNT(*) FILTER (WHERE status = 'success') AS success_count,
            COUNT(*) FILTER (WHERE status = 'failed')  AS failed_count,
            COUNT(*) AS total_count
          FROM sync_items
          WHERE job_id = ${params.jobId}
          GROUP BY job_id
        ) AS counts
        WHERE j.id = counts.job_id;
  `;
  },
});
