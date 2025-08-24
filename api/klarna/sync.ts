import { syncTenant } from '@/iam/topics';
import { Attribute, Subscription, Topic } from 'encore.dev/pubsub';
import { db } from './database';
import { iam, klarna } from '../encore.gen/clients';
import { Payout } from './types';
import dayjs from 'dayjs';

interface SyncPayoutParams {
  partition: Attribute<string | number | 'singleton'>;
  tenantId: number;
  jobId: number;
  payout: Payout;
}

type SyncedAt = {
  synced_at: string;
};

export const syncPayout = new Topic<SyncPayoutParams>('sync-payout', {
  orderingAttribute: 'partition',
  deliveryGuarantee: 'exactly-once',
});

new Subscription(syncTenant, 'klarna-payout', {
  handler: async (params) => {
    const row = await db.queryRow<SyncedAt>`
          SELECT synced_at FROM payouts WHERE tenant_id = ${params.tenantId} ORDER BY synced_at DESC LIMIT 1
        `;

    const payouts = await klarna.getPayouts({
      from: row?.synced_at,
    });

    for (const payout of payouts.data) {
      await syncPayout.publish({
        partition: 'singleton',
        tenantId: params.tenantId,
        jobId: params.jobId,
        payout,
      });
    }
  },
});

new Subscription(syncPayout, 'process', {
  handler: async (params) => {
    const item = await iam.syncItemStart({
      jobId: params.jobId,
      source: 'klarna',
      sourceType: 'payout',
      sourceId: params.payout.payment_reference,
    });

    try {
      const transactions = await klarna.getPayoutTransactions({
        paymentReference: params.payout.payment_reference,
      });

      await db.exec`
      INSERT INTO payouts (
        payment_reference,
        payout_date,
        currency,
        tenant_id,
        selling_amount,
        payout_amount,
        tax_amount,
        fee_amount,
        returns_amount,
        raw_json
      )
      VALUES (
        ${params.payout.payment_reference},
        ${dayjs(params.payout.payout_date).toDate()},
        ${params.payout.currency_code},
        ${params.tenantId},
        ${params.payout.totals.sale_amount},
        ${params.payout.totals.settlement_amount},
        ${params.payout.totals.tax_amount},
        ${params.payout.totals.fee_amount},
        ${params.payout.totals.return_amount},
        ${JSON.stringify({
          payout: params.payout,
          transactions: transactions.data,
        })}
      )
  `;
    } catch (error) {
      console.log(error);

      await iam.syncItemEnd({
        jobId: params.jobId,
        jobItemId: item.jobItemId,
        status: 'failed',
        error: (error as Error)?.message,
      });

      throw error;
    }
  },
});
