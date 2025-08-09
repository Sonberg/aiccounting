import { api } from 'encore.dev/api';

interface Params {
  tenantId: number;
}

interface Response {
  accessToken: string;
}

export const getToken = api<Params, Response>(
  {
    path: '/fortnox/token',
    method: 'POST',
    expose: false,
  },
  async () => {
    return {
      accessToken: '',
    };
  }
);
