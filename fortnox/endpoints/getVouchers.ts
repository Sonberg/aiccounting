import { api } from 'encore.dev/api';
import { getToken } from '../database';
import { getFortnoxClient } from '../client';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import { log } from 'console';

interface FortnoxVoucher {
  ApprovalState: number;
  Comments: string | null;
  Description: string | null;
  ReferenceNumber: string;
  ReferenceType:
    | 'INVOICE'
    | 'SUPPLIERINVOICE'
    | 'INVOICEPAYMENT'
    | 'SUPPLIERPAYMENT'
    | 'MANUAL'
    | 'CASHINVOICE'
    | 'ACCRUAL';
  TransactionDate: string;
  VoucherNumber: number;
  VoucherSeries: string;
  Year: number;
}

interface FortnoxVoucherResponse {
  MetaInformation: {
    '@CurrentPage': number;
    '@TotalPages': number;
    '@TotalResources': number;
  };
  Vouchers: FortnoxVoucher[];
}

interface Params {
  from?: string;
  to?: string;
  voucherSeries?: string;
  limit?: number;
}

interface Response {
  data: FortnoxVoucher[];
}

export const getVouchers = api<Params, Response>(
  {
    path: '/fortnox/vouchers',
    method: 'GET',
    expose: false,
  },
  async ({ from, to, voucherSeries, limit }) => {
    const token = await getToken(1);
    const fortnox = getFortnoxClient(token);

    let vouchers: FortnoxVoucher[] = [];
    let currentPage = 1;
    let totalPages = 1;

    do {
      const { data } = await fortnox.get<FortnoxVoucherResponse>(
        `/3/vouchers`,
        {
          params: {
            fromdate: from ? dayjs(from).format('YYYY-MM-DD') : undefined,
            todate: to ? dayjs(to).format('YYYY-MM-DD') : undefined,
            voucherseries: voucherSeries,
            page: currentPage,
            sort: 'vouchernumber',
          },
        }
      );

      vouchers.push(...data.Vouchers);

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
