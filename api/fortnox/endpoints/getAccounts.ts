import { api } from 'encore.dev/api';
import { getToken } from '../database';
import { getFortnoxClient } from '../client';

export interface FortnoxAccount {
  Active: boolean;
  BalanceBroughtForward: number;
  CostCenter: string | null;
  CostCenterSettings: 'ALLOWED' | 'MANDATORY' | 'NOTALLOWED';
  Description: string;
  Number: number;
  Project: string;
  ProjectSettings: 'ALLOWED' | 'MANDATORY' | 'NOTALLOWED';
  SRU: number;
  VATCode: string | null;
  Year: number;
}

interface FortnoxAccountResponse {
  Accounts: FortnoxAccount[];
}

export interface GetFortnoxAccountsParams {
  tenantId: number;
}

export interface GetFortnoxAccountsResponse {
  data: FortnoxAccount[];
}

export const getAccounts = api<
  GetFortnoxAccountsParams,
  GetFortnoxAccountsResponse
>(
  {
    method: 'GET',
    path: '/fortnox/accounts',
  },
  async ({ tenantId }) => {
    const token = await getToken(tenantId);
    const client = getFortnoxClient(token);

    const { data } = await client.get<FortnoxAccountResponse>(`/3/accounts`);

    return {
      data: data.Accounts,
    };
  }
);

// FiscalYears
// // VoucherSeries
