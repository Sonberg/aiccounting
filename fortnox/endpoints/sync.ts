import { groupBy } from '@/utils/groupBy';
import dayjs from 'dayjs';
import { api } from 'encore.dev/api';
import { core, fortnox } from '~encore/clients';

interface Params {
  tenantId: number;
  from?: {
    year: number;
    month: number;
  };
  to?: {
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
    const from = params.from
      ? dayjs(`${params.from.year}-${params.from.month}-01`).format(
          'YYYY-MM-DD'
        )
      : undefined;

    const to = params.to
      ? dayjs(`${params.to.year}-${params.to.month}-01`)
          .endOf('month')
          .format('YYYY-MM-DD')
      : undefined;

    const vouchers = await fortnox.getVouchers({
      from,
      to,
      includeRows: true,
    });

    const groupedVouchers = groupBy(vouchers.data, (x) =>
      dayjs(x.TransactionDate).format('YYYY-MM')
    );

    for (const [key, value] of Object.entries(groupedVouchers)) {
      await core.upload({
        fileName: `${params.tenantId}-fortnox-vouchers-${key}`,
        content: JSON.stringify(value),
      });
    }
  }
);
