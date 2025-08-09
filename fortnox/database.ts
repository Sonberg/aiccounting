import dayjs, { Dayjs } from 'dayjs';
import { SQLDatabase } from 'encore.dev/storage/sqldb';
import { isTokenValid } from './utlls';
import { refreshToken } from './client';

export const db = new SQLDatabase('fortnox', {
  migrations: './migrations',
});

export interface SetTokenArgs {
  tenantId: number;
  accessToken: string;
  refreshToken: string;
  createdAt: Dayjs;
}

export interface Token {
  tenantId: number;
  accessToken: string;
  refreshToken: string;
  createdAt: Dayjs;
  isValid: boolean;
}

interface TokenRow {
  tenant_id: number;
  access_token: string;
  refresh_token: string;
  created_at: string;
}

export async function setToken(args: SetTokenArgs) {
  await db.rawExec(
    `INSERT INTO tokens (tenant_id, access_token, refresh_token, created_at) VALUES ($1, $2, $3, $4)`,
    args.tenantId,
    args.accessToken,
    args.refreshToken,
    args.createdAt.toDate()
  );
}

export async function getToken(tenantId: number): Promise<Token> {
  const row = await db.queryRow<TokenRow>`
      SELECT * FROM tokens where tenant_id = ${tenantId}
      ORDER BY id DESC
      LIMIT 1
      `;

  if (!row) {
    throw Error('No token found');
  }

  const token = {
    tenantId: row.tenant_id,
    accessToken: row.access_token,
    refreshToken: row.refresh_token,
    createdAt: dayjs(row.created_at),
    isValid: isTokenValid(row.access_token),
  };

  if (token.isValid) {
    return token;
  }

  const refreshed = await refreshToken(token.refreshToken);

  await setToken({
    tenantId: tenantId,
    accessToken: refreshed.accessToken,
    refreshToken: refreshed.refreshToken,
    createdAt: dayjs(),
  });

  return {
    tenantId: row.tenant_id,
    accessToken: refreshed.accessToken,
    refreshToken: refreshed.refreshToken,
    createdAt: dayjs(),
    isValid: true,
  };
}
