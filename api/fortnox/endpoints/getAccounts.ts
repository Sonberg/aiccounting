import { api } from 'encore.dev/api';
import { getToken } from '../database';
import { getFortnoxClient } from '../client';
import { FortnoxAccount } from '../types';

interface FortnoxResponse {
  Accounts: FortnoxAccount[];
}

interface GetFortnoxAccountsRequest {
  tenantId: number;
}

interface GetFortnoxAccountsResponse {
  data: FortnoxAccount[];
}

export const getAccounts = api<
  GetFortnoxAccountsRequest,
  GetFortnoxAccountsResponse
>(
  {
    method: 'GET',
    path: '/fortnox/accounts',
  },
  async ({ tenantId }) => {
    const token = await getToken(tenantId);
    const client = getFortnoxClient(token);

    const { data } = await client.get<FortnoxResponse>(`/3/accounts`);

    return {
      data: data.Accounts,
    };
  }
);

// FiscalYears
// // VoucherSeries
