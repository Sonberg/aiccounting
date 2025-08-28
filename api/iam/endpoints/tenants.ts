import { api } from 'encore.dev/api';
import { db } from '@/database';

interface CreateTenantRequest {
  name: string;
}

interface Tenant {
  id: number;
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

export interface GetTenantsRequest {}
export interface GetTenantsResponse {
  data: Tenant[];
}

export const getTenants = api<GetTenantsRequest, GetTenantsResponse>(
  {
    path: '/tenants',
    method: 'GET',
    auth: false,
  },
  async () => {
    return {
      data: [
        {
          id: 1,
          name: 'Glufs',
          created_at: '',
        },
      ],
    };
  }
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
