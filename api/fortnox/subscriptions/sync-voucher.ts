import { Subscription } from 'encore.dev/pubsub';
import { syncVoucher } from '../topics';
import { sync } from '../../encore.gen/clients';
import { getFortnoxClient } from '../client';
import { getToken } from '../database';
import { FortnoxVoucher } from '../types';
import { db } from '@/database';

new Subscription(syncVoucher, 'process', {
  handler: async ({ tenantId, voucher, jobId }) => {
    const item = await sync.startSyncItem({
      jobId: jobId,
      source: 'fortnox',
      sourceType: 'voucher',
      sourceId: voucher.VoucherSeries + '/' + voucher.VoucherNumber,
    });

    const token = await getToken(tenantId);
    const client = getFortnoxClient(token);
    const { data } = await client.get<{ Voucher: FortnoxVoucher }>(
      `/3/vouchers/${voucher.VoucherSeries}/${voucher.VoucherNumber}`
    );

    const tx = await db.begin();

    try {
      await tx.queryRow<{ id: number }>`
          INSERT INTO fortnox_vouchers (
            tenant_id,
            approval_state,
            year,
            voucher_number,
            voucher_series,
            transaction_date,
            description,
            raw_json
          ) VALUES (
            ${tenantId},
            ${data.Voucher.ApprovalState},
            ${data.Voucher.Year},
            ${data.Voucher.VoucherNumber},
            ${data.Voucher.VoucherSeries},
            ${data.Voucher.TransactionDate},
            ${data.Voucher.Description},
            ${JSON.stringify(data.Voucher)}::jsonb
          )
          ON CONFLICT (tenant_id, voucher_series, voucher_number) DO UPDATE
            SET
              approval_state = EXCLUDED.approval_state,
              transaction_date = EXCLUDED.transaction_date,
              description = EXCLUDED.description,
              raw_json = EXCLUDED.raw_json
          RETURNING id;
        `;

      await tx.commit();
      await sync.stopSyncItem({
        jobId: jobId,
        jobItemId: item.jobItemId,
        status: 'success',
      });
    } catch (error) {
      console.log(error);

      await tx.rollback();
      await sync.stopSyncItem({
        jobId: jobId,
        jobItemId: item.jobItemId,
        status: 'failed',
        error: (error as Error)?.message,
      });
    }
  },
});
