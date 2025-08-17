import { api } from 'encore.dev/api';
import { getToken } from '../database';
import { getFortnoxClient } from '../client';
import dayjs from 'dayjs';

export interface FortnoxVoucher {
  ApprovalState: number;
  Comments: string | null;
  Description: string | null;
  ReferenceNumber: string | null;
  ReferenceType:
    | 'INVOICE'
    | 'SUPPLIERINVOICE'
    | 'INVOICEPAYMENT'
    | 'SUPPLIERPAYMENT'
    | 'MANUAL'
    | 'CASHINVOICE'
    | 'ACCRUAL'
    | string
    | null;
  TransactionDate: string;
  VoucherNumber: number;
  VoucherSeries: string;
  VoucherRows?: FortnoxVoucherRow[];
  Year: number;
}

interface FortnoxVoucherRow {
  Account: number;
  CostCenter: string | null;
  Credit: number;
  Debit: number;
  Description: string | null;
  Project: string | null;
  Quantity: number;
  Removed: boolean;
  TransactionInformation: string | null;
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
  includeRows?: boolean;
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
  async ({ from, to, voucherSeries, limit, includeRows }) => {
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
            sortby: 'vouchernumber',
            sortorder: 'descending',
          },
        }
      );
      for (const voucher of data.Vouchers) {
        if (includeRows) {
          await new Promise<void>((res, _) => setTimeout(() => res(), 500));

          voucher.VoucherRows = await getRows(
            voucher.VoucherSeries,
            voucher.VoucherNumber
          );
        }

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

    async function getRows(voucherSeries: string, voucherNumber: number) {
      const { data } = await fortnox.get<{ Voucher: FortnoxVoucher }>(
        `/3/vouchers/${voucherSeries}/${voucherNumber}`
      );

      return data.Voucher.VoucherRows ?? [];
    }
  }
);
