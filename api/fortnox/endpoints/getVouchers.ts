import dayjs from 'dayjs';
import { api } from 'encore.dev/api';
import { getToken } from '../database';
import { getFortnoxClient } from '../client';
import { FortnoxVoucher } from '../types';
import { log } from 'console';
import { sleep } from '../../utils/sleep';

interface FortnoxResponse {
  MetaInformation: {
    '@CurrentPage': number;
    '@TotalPages': number;
    '@TotalResources': number;
  };
  Vouchers: FortnoxVoucher[];
}

interface GetVouchersRequest {
  from?: string;
  to?: string;
  voucherSeries?: string;
  lastModified?: string;
  limit?: number;
}

interface GetVouchersResponse {
  data: FortnoxVoucher[];
}

export const getVouchers = api<GetVouchersRequest, GetVouchersResponse>(
  {
    path: '/fortnox/vouchers',
    method: 'GET',
    expose: false,
  },
  async ({ from, to, voucherSeries, limit, lastModified }) => {
    const token = await getToken(1);
    const fortnox = getFortnoxClient(token);

    let vouchers: FortnoxVoucher[] = [];
    let currentPage = 1;
    let totalPages = 1;

    do {
      const { data, ...rest } = await fortnox.get<FortnoxResponse>(
        `/3/vouchers`,
        {
          params: {
            fromdate: from ? dayjs(from).format('YYYY-MM-DD') : undefined,
            todate: to ? dayjs(to).format('YYYY-MM-DD') : undefined,
            lastmodified: lastModified
              ? dayjs(lastModified).format('YYYY-MM-DD HH:mm')
              : undefined,
            voucherseries: voucherSeries,
            page: currentPage,
            sortby: 'vouchernumber',
            sortorder: 'descending',
          },
          validateStatus: () => true,
        }
      );

      await sleep(400);

      log(data, rest.request);

      for (const voucher of data.Vouchers) {
        vouchers.push(voucher);
      }

      totalPages = data.MetaInformation['@TotalPages'];
      currentPage++;

      if (limit && vouchers.length >= limit) {
        vouchers = vouchers.slice(0, limit);
        break;
      }
    } while (currentPage <= totalPages);

    return { data: vouchers };
  }
);
