import { Subscription } from 'encore.dev/pubsub';
import { syncVoucher } from '../topics';
import { sync } from '~encore/clients';
import { getFortnoxClient } from '../client';
import { getToken } from '../database';
import { FortnoxVoucher } from '../types';
import { db } from '@/database';
import { createEmbedding } from '../../core/topics';
import dayjs from 'dayjs';

type Id = { id: number };

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
      const content = JSON.stringify(data.Voucher);
      const row = await tx.queryRow<Id>`
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
            ${content}::jsonb
          )
          ON CONFLICT (tenant_id, voucher_series, voucher_number) DO UPDATE
            SET
              approval_state = EXCLUDED.approval_state,
              transaction_date = EXCLUDED.transaction_date,
              description = EXCLUDED.description,
              raw_json = EXCLUDED.raw_json
          RETURNING id;
        `;

      await createEmbedding.publish({
        tableName: 'fortnox_vouchers',
        tenantId: tenantId,
        rowId: row!.id,
        summary: fortnoxEmbeddingString(data.Voucher),
        metadata: {
          year: data.Voucher.Year,
          VoucherSeries: data.Voucher.VoucherSeries,
          VoucherNumber: data.Voucher.VoucherNumber,
          TransactionDate: data.Voucher.TransactionDate,
        },
      });

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

const fortnoxEmbeddingString = (voucher: FortnoxVoucher) =>
  `
Fortnox voucher ${voucher.VoucherSeries}${voucher.VoucherNumber} (${
    voucher.Year
  }):
Approval state: ${voucher.ApprovalState}, Reference: ${
    voucher.ReferenceNumber ?? 'N/A'
  }, Reference type: ${voucher.ReferenceType ?? 'N/A'},
Comments: ${voucher.Comments ?? 'N/A'}, Description: ${
    voucher.Description ?? 'N/A'
  }, Transaction date: ${dayjs(voucher.TransactionDate).format('YYYY-MM-DD')},
Voucher rows: ${voucher.VoucherRows?.map(
    (row) => `
- Account: ${row.Account}, Cost center: ${row.CostCenter ?? 'N/A'}, Debit: ${
      row.Debit
    }, Credit: ${row.Credit}, 
  Description: ${row.Description ?? 'N/A'}, Project: ${
      row.Project ?? 'N/A'
    }, Quantity: ${row.Quantity}, Removed: ${row.Removed}, Transaction info: ${
      row.TransactionInformation ?? 'N/A'
    }
`
  ).join(' ')}
`.trim();
