import { syncStarted } from '@/sync/topics';
import { Subscription } from 'encore.dev/pubsub';
import { fortnox, sync } from '../../encore.gen/clients';
import { clearVouchers, db } from '../database';
import { syncVoucher } from '../topics';
import { sleep } from '../../utils/sleep';
import dayjs from 'dayjs';

type SyncedAt = {
  synced_at: string;
};

new Subscription(syncStarted, 'sync-vouchers', {
  handler: async (params) => {
    const item = await sync.startSyncItem({
      jobId: params.jobId,
      source: 'fortnox',
      sourceType: 'voucher',
      sourceId: null,
    });

    const row = await db.queryRow<SyncedAt>`
      SELECT synced_at FROM vouchers WHERE tenant_id = ${params.tenantId} ORDER BY synced_at DESC LIMIT 1
    `;

    const modifiedVouchers = await fortnox.getVouchers({
      lastModified: row?.synced_at,
    });

    const groupedVouchers = modifiedVouchers.data.reduce((acc, voucher) => {
      const series = voucher.VoucherSeries;
      const number = voucher.VoucherNumber;

      if (!acc[series]) {
        acc[series] = number;
      } else if (number < acc[series]) {
        acc[series] = number;
      }

      return acc;
    }, {} as Record<string, number>);

    for (const series in groupedVouchers) {
      await clearVouchers(series, groupedVouchers[series], params.tenantId);
    }

    const fromDate = modifiedVouchers.data.reduce(
      (earliest, current) => {
        const cursor = dayjs(current.TransactionDate);

        if (!earliest) {
          return cursor;
        }

        return cursor < earliest ? cursor : earliest;
      },
      row?.synced_at ? dayjs(row.synced_at) : null
    );

    const vouchers = await fortnox.getVouchers({
      from: row?.synced_at
        ? fromDate?.add(-1, 'week').toISOString()
        : undefined,
    });

    for (const voucher of vouchers.data) {
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
