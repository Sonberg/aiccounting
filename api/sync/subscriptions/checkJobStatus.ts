import { Subscription } from 'encore.dev/pubsub';
import { syncCompleted, syncUpdated } from '../topics';
import { sleep } from '../../utils/sleep';
import { db } from '../database';

new Subscription(syncUpdated, 'check-status', {
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

    await syncCompleted.publish({
      jobId: params.jobId,
      tenantId: params.tenantId,
    });
  },
});
