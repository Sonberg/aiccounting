import { api } from 'encore.dev/api';

export const create = api(
  {
    expose: true,
    method: 'POST',
    path: '/tenants',
  },
  () => console.log('Tenant created')
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
