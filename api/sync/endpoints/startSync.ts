import { api } from 'encore.dev/api';
import { syncStarted } from '../topics';
import { db } from '../database';

interface StartSyncRequest {
  tenantId: number;
}

export const startSync = api<StartSyncRequest>(
  {
    path: '/sync',
    method: 'POST',
    expose: true,
  },
  async (params) => {
    await syncStarted.publish({
      tenantId: params.tenantId,
      jobId: await db.queryRow<{ id: number }>`
            INSERT INTO sync_jobs (tenant_id, status)
            VALUES (${params.tenantId}, 'pending')
            RETURNING id;
        `.then((r) => r!.id),
    });
  }
);
