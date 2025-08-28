import { api } from 'encore.dev/api';
import { db } from '@/database';
import { syncUpdated } from '../topics';

interface SyncItemUpdateRequest {
  jobId: number;
  jobItemId: number;
  status: 'success' | 'failed';
  error?: string;
}

export const stopSyncItem = api<SyncItemUpdateRequest>(
  {
    path: '/sync/:jobId/items/stop',
    method: 'POST',
  },
  async ({ jobId, jobItemId, status, error }) => {
    const tx = await db.begin();

    try {
      await tx.exec`
        UPDATE sync_job_items
        SET status = ${status},
            error = ${error ?? null},
            finished_at = NOW()
        WHERE id = ${jobItemId};
      `;

      const result = await tx.queryRow<{ updated_at: Date; tenant_id: number }>`
        UPDATE sync_jobs
        SET updated_at = NOW()
        WHERE id = ${jobId}
        RETURNING updated_at, tenant_id;
      `;

      await tx.commit();

      if (result?.updated_at) {
        await syncUpdated.publish({
          tenantId: result.tenant_id,
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
