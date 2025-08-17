import { api } from 'encore.dev/api';
import { db } from '../database';
import { syncTenant } from '../topics';

interface CreateTenantRequest {
  name: string;
}

interface Tenant {
  id: string;
  name: string;
  created_at: string;
}

export const createTenant = api<CreateTenantRequest, Tenant>(
  {
    path: '/tenants',
    method: 'POST',
    auth: false,
  },
  async (req) => {
    const result = await db.queryRow<Tenant>`
    INSERT INTO tenants (name)
    VALUES (${req.name})
    RETURNING id, name, created_at
  `;
    return result!;
  }
);

interface SyncTenantRequest {
  id: number;
}

export const sync = api<SyncTenantRequest>(
  {
    path: '/tenants/:id/sync',
    method: 'POST',
  },
  async (params) =>
    await syncTenant.publish({
      tenantId: params.id,
    })
);

export const connectKlarna = api(
  {
    expose: true,
    method: 'POST',
    path: '/tenants/:id/klarna/connect',
  },
  (params: { id: string }) => console.log('Klarna connected')
);

export const connectFortnox = api(
  {
    expose: true,
    method: 'POST',
    path: '/tenants/:id/fortnox/connect',
  },
  (params: { id: string }) => console.log('Fortnox connected')
);
