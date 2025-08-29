import { syncStarted } from '@/sync/topics';
import { Subscription } from 'encore.dev/pubsub';
import { fortnox, sync } from '~encore/clients';
import { syncVoucher } from '../topics';
import { sleep } from '../../utils/sleep';
import { db } from '@/database';

type Saved = {
  voucher_series: string;
  voucher_number: number;
};

type SyncedAt = {
  synced_at: string;
};

new Subscription(syncStarted, 'sync-vouchers', {
  ackDeadline: '1h',
  handler: async (params) => {
    const item = await sync.startSyncItem({
      jobId: params.jobId,
      source: 'fortnox',
      sourceType: 'voucher',
      sourceId: null,
    });

    const row = await db.queryRow<SyncedAt>`
      SELECT synced_at 
      FROM fortnox_vouchers 
      WHERE tenant_id = ${params.tenantId} 
      ORDER BY synced_at DESC 
      LIMIT 1
    `;

    const modified = await fortnox.getVouchers({
      lastModified: row?.synced_at,
    });

    for (const voucher of modified.data) {
      await db.exec`
        DELETE FROM fortnox_vouchers 
        WHERE voucher_series = ${voucher.VoucherSeries}
          AND tenant_id = ${params.tenantId} 
          AND voucher_number >= ${voucher.VoucherNumber}
      `;
    }

    const all = await fortnox.getVouchers({});
    const saved = await db.queryAll<Saved>`
      SELECT voucher_series, voucher_number
      FROM fortnox_vouchers
      WHERE tenant_id = ${params.tenantId} 
    `;

    for (const voucher of all.data) {
      const existing = saved.find(
        (x) =>
          x.voucher_number == voucher.VoucherNumber &&
          x.voucher_series == voucher.VoucherSeries
      );

      if (existing) {
        continue;
      }

      await syncVoucher.publish({
        tenantId: params.tenantId,
        jobId: params.jobId,
        voucher,
      });

      await sleep(400); // To avoid hitting rate limits
    }

    await sync.stopSyncItem({
      jobId: params.jobId,
      jobItemId: item.jobItemId,
      status: 'success',
    });
  },
});
