import axios from 'axios';
import { secret } from 'encore.dev/config';
import { Token } from './database';

const clientId = secret('FORTNOX_CLIENT_ID')();
const clientSecret = secret('FORTNOX_CLIENT_SECRET')();

export const FortnoxAuthClient = axios.create({
  baseURL: 'https://apps.fortnox.se',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
  },
});

export const getFortnoxClient = (token: Token) =>
  axios.create({
    baseURL: 'https://api.fortnox.se/',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token.accessToken}`,
    },
  });

interface RefreshTokenResponse {
  access_token: string;
  refresh_token: string;
}

export const refreshToken = async (token: string) => {
  const body = new FormData();

  body.append('grant_type', 'refresh_token');
  body.append('refresh_token', token);

  const { data } = await FortnoxAuthClient.post<RefreshTokenResponse>(
    '/oauth-v1/token',
    body
  );

  return {
    refreshToken: data.refresh_token,
    accessToken: data.access_token,
  };
};
