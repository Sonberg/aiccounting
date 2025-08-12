import { fileByConvention } from '@/utils/filesByConvention';
import { log } from 'console';
import dayjs from 'dayjs';
import { api } from 'encore.dev/api';
import { Attribute, Subscription, Topic } from 'encore.dev/pubsub';
import { core, fortnox } from '~encore/clients';

interface Params {
  tenantId: number;
  from: {
    year: number;
    month: number;
  };
  to: {
    year: number;
    month: number;
  };
}

export const sync = api<Params>(
  {
    method: 'POST',
    path: '/fortnox/sync',
  },
  async (params) => {
    const end = dayjs(`${params.to.year}-${params.to.month}-01`).endOf('month');
    let current = dayjs(`${params.from.year}-${params.from.month}-01`).startOf(
      'month'
    );

    while (true) {
      if (current.isAfter(end)) {
        log('isAfter');
        break;
      }

      log('Publish', current.format('YYYY-MM'));

      try {
        await process({
          tenantId: 1,
          month: current.toISOString(),
        });
      } catch (err) {
        log(err);
      }

      current = current.add(1, 'month').startOf('month');
    }
  }
);

interface SyncFortnoxParams {
  tenantId: Attribute<number>;
  month: string;
}

const syncVouchers = new Topic<SyncFortnoxParams>('sync-vouchers', {
  deliveryGuarantee: 'exactly-once',
  orderingAttribute: 'tenantId',
});

const _ = new Subscription(syncVouchers, 'upload-vouchers', {
  handler: async (params) => {},
});

const process = async (params: SyncFortnoxParams) => {
  const month = dayjs(params.month);
  const vouchers = await fortnox.getVouchers({
    from: month.startOf('month').format('YYYY-MM-DD'),
    to: month.endOf('month').format('YYYY-MM-DD'),
    includeRows: true,
  });

  await core.upload({
    fileName: fileByConvention(params.tenantId, 'fortnox', 'vouchers', month),
    content: JSON.stringify(vouchers),
  });
};
