import { Attribute, Subscription, Topic } from 'encore.dev/pubsub';
import dayjs from 'dayjs';

import { db } from '@/database';
import { klarna, sync } from '~encore/clients';
import { Payout, PayoutTransaction } from './types';
import { sleep } from '../utils/sleep';
import { syncStarted } from '../sync/topics';
import { createEmbedding } from '../core/topics';

interface SyncPayoutParams {
  partition: Attribute<string | number | 'singleton'>;
  tenantId: number;
  jobId: number;
  payout: Payout;
}

type SyncedAt = {
  synced_at: string;
};

type Row = {
  id: number;
};

export const syncPayout = new Topic<SyncPayoutParams>('sync-payout', {
  orderingAttribute: 'partition',
  deliveryGuarantee: 'at-least-once',
});

new Subscription(syncStarted, 'klarna-payout', {
  handler: async (params) => {
    const row = await db.queryRow<SyncedAt>`
          SELECT synced_at FROM klarna_payouts WHERE tenant_id = ${params.tenantId} ORDER BY synced_at DESC LIMIT 1
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

      await sleep(300);
    }
  },
});

new Subscription(syncPayout, 'process', {
  handler: async (params) => {
    const item = await sync.startSyncItem({
      jobId: params.jobId,
      source: 'klarna',
      sourceType: 'payout',
      sourceId: params.payout.payment_reference,
    });

    try {
      const payout = params.payout;
      const currency = payout.currency_code;
      const transactions = await klarna.getPayoutTransactions({
        paymentReference: payout.payment_reference,
      });

      const content = JSON.stringify({
        payout,
        transactions: transactions.data,
      });

      const row = await db.queryRow<Row>`
      INSERT INTO klarna_payouts (
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
        ${payout.totals.sale_amount},
        ${payout.totals.settlement_amount},
        ${payout.totals.tax_amount},
        ${payout.totals.fee_amount},
        ${payout.totals.return_amount},
        ${content}
      )
      ON CONFLICT (payment_reference) DO NOTHING
      RETURNING id;
  `;

      await sync.stopSyncItem({
        jobId: params.jobId,
        jobItemId: item.jobItemId,
        status: 'success',
      });

      await createEmbedding.publish({
        tableName: 'klarna_payouts',
        tenantId: params.tenantId,
        rowId: row!.id,
        summary: klarnaEmbeddingString(params.payout, transactions.data),
        metadata: {
          paymentReference: payout.payment_reference,
          currencyCode: payout.currency_code,
        },
      });
    } catch (error) {
      console.log(error);

      await sync.stopSyncItem({
        jobId: params.jobId,
        jobItemId: item.jobItemId,
        status: 'failed',
        error: (error as Error)?.message,
      });

      throw error;
    }
  },
});

const klarnaEmbeddingString = (
  payout: Payout,
  transactions: PayoutTransaction[]
) =>
  `
Klarna payout ${payout.payment_reference} for merchant ${payout.merchant_id} (${
    payout.merchant_settlement_type
  }) on ${dayjs(payout.payout_date).format('YYYY-MM-DD')}:
Currency: ${payout.currency_code}${
    payout.currency_code_of_registration_country
      ? ` (registration country: ${payout.currency_code_of_registration_country})`
      : ''
  },
Totals: Sale ${payout.totals.sale_amount}, Settlement ${
    payout.totals.settlement_amount
  }, Fee ${payout.totals.fee_amount}, Tax ${
    payout.totals.tax_amount
  }, Returns ${payout.totals.return_amount},
Transactions: ${transactions
    .map(
      (tx) => `
- Type: ${tx.type}, Detailed type: ${tx.detailed_type}, Amount: ${tx.amount} ${
        tx.currency_code
      }, 
  Sale date: ${
    tx.sale_date ? dayjs(tx.sale_date).format('YYYY-MM-DD') : 'N/A'
  }, Capture date: ${
        tx.capture_date ? dayjs(tx.capture_date).format('YYYY-MM-DD') : 'N/A'
      }, 
  Country: ${tx.purchase_country ?? 'N/A'}, Order ID: ${
        tx.order_id ?? 'N/A'
      }, Short order ID: ${tx.short_order_id ?? 'N/A'}
`
    )
    .join(' ')}
`.trim();
