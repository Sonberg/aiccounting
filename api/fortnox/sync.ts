import { syncTenant } from '@/iam/topics';
import { log } from 'console';
import { Attribute, Subscription, Topic } from 'encore.dev/pubsub';
import { FortnoxVoucher } from './endpoints/getVouchers';
import { fortnox } from '~encore/clients';
import { db, getToken } from './database';
import { getFortnoxClient } from './client';

export interface SyncVoucherParams {
  tenantId: Attribute<number>;
  voucher: FortnoxVoucher;
}

export const syncVoucher = new Topic<SyncVoucherParams>('sync-voucher', {
  orderingAttribute: 'tenantId',
  deliveryGuarantee: 'exactly-once',
});

export const _1 = new Subscription(syncTenant, 'fortnox-vouchers', {
  handler: async (params) => {
    log('Sync Fortnox vouchers', params.tenantId);

    const vouchers = await fortnox.getVouchers({});

    for (const voucher of vouchers.data) {
      await syncVoucher.publish({
        tenantId: params.tenantId,
        voucher,
      });
    }
  },
});

export const _2 = new Subscription(syncTenant, 'fortnox-accounts', {
  handler: async (params) => {
    log('Sync Fortnox account', params.tenantId);
  },
});

export const _3 = new Subscription(syncVoucher, 'progress', {
  handler: async ({ tenantId, voucher }) => {
    const token = await getToken(tenantId);
    const client = getFortnoxClient(token);
    const { data } = await client.get<{ Voucher: FortnoxVoucher }>(
      `/3/vouchers/${voucher.VoucherSeries}/${voucher.VoucherNumber}`
    );

    log(JSON.stringify(data.Voucher, null, 2));

    const rows = data.Voucher.VoucherRows ?? [];
    const tx = await db.begin();

    try {
      const inserted = await tx.queryRow<{ id: number }>`
        INSERT INTO vouchers (
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
        ON CONFLICT (voucher_series, voucher_number) DO UPDATE
          SET
            approval_state = EXCLUDED.approval_state,
            transaction_date = EXCLUDED.transaction_date,
            description = EXCLUDED.description,
            raw_json = EXCLUDED.raw_json
        RETURNING id;
      `;

      // Insert rows
      //   for (const r of rows) {
      //     await tx.exec`
      //         INSERT INTO voucher_rows (
      //             voucher_id,
      //             account_number,
      //             description,
      //             debit,
      //             credit,
      //             raw_json
      //         ) VALUES (
      //             ${inserted!.id},
      //             ${Number(r.Account)},
      //             ${r.Description || null},
      //             ${parseAmount(r.Debit)},
      //             ${parseAmount(r.Credit)},
      //             ${JSON.stringify(r)}::jsonb
      //         );
      //     `;
      //   }

      await tx.commit();
    } catch (error) {
      console.log(error);

      await tx.rollback();
    }
  },
});
