import { appMeta } from 'encore.dev';
import { api } from 'encore.dev/api';
import { secret } from 'encore.dev/config';

const clientId = secret('FORTNOX_CLIENT_ID');

export const getReturnUrl = () => `${appMeta().apiBaseUrl}/fortnox/callback`;

export const authenticate = api(
  {
    path: '/fortnox/authenticate',
    method: 'POST',
    expose: true,
  },
  async () => {
    const url = 'https://apps.fortnox.se/oauth-v1/auth';
    const params = new URLSearchParams();

    params.append('client_id', clientId());
    params.append('redirect_uri', getReturnUrl());
    params.append('scope', 'companyinformation bookkeeping');
    params.append('state', '1');
    params.append('access_type', 'offline');
    params.append('response_type', 'code');
    params.append('account_type', 'service');

    return {
      url: `${url}?${params}`,
    };
  }
);
