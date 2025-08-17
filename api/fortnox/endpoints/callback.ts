import { api } from 'encore.dev/api';
import { FortnoxAuthClient } from '../client';
import { log } from 'console';
import { getReturnUrl } from './authenticate';
import { AxiosResponse } from 'axios';
import { setToken } from '../database';
import dayjs from 'dayjs';

interface FortnoxResponse {
  access_token: string;
  refresh_token: string;
}

export const callback = api.raw(
  {
    path: '/fortnox/callback',
    method: 'GET',
    expose: true,
  },
  async (req, res) => {
    const body = new FormData();
    const query = new URLSearchParams(req.url?.split('?')[1]);

    body.append('grant_type', 'authorization_code');
    body.append('code', query.get('code')!);
    body.append('redirect_uri', getReturnUrl());
    body.append('grant_type', 'authorization_code');

    const { data } = await FortnoxAuthClient.postForm<
      FormData,
      AxiosResponse<FortnoxResponse>
    >('/oauth-v1/token', body);

    log(data);

    if (!data.access_token) {
      throw new Error('Unable to get access_token from Code');
    }

    await setToken({
      tenantId: Number(query.get('state')),
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      createdAt: dayjs(),
    });

    res.statusCode = 200;
    res.end();
  }
);
