import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import { secret } from 'encore.dev/config';
import { Token } from './database';
import { sleep } from '../utils/sleep';

const clientId = secret('FORTNOX_CLIENT_ID')();
const clientSecret = secret('FORTNOX_CLIENT_SECRET')();

export const FortnoxAuthClient = axios.create({
  baseURL: 'https://apps.fortnox.se',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString(
      'base64'
    )}`,
  },
});

const MAX_RETRIES = 10; // Lowered to avoid very long retry loops
const INITIAL_DELAY_MS = 200;
const MAX_DELAY_MS = 10_000; // cap max wait

const isRetryableError = (error: AxiosError) => {
  return (
    error.response?.status === 429 || // rate limit
    error.code === 'ECONNRESET' ||
    error.code === 'ETIMEDOUT' ||
    error.code === 'ENOTFOUND'
  );
};

export const getFortnoxClient = (token: Token) => {
  const client = axios.create({
    baseURL: 'https://api.fortnox.se/',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token.accessToken}`,
    },
  });

  client.interceptors.request.use((config) => {
    if (!('x-retry-count' in config.headers)) {
      (config.headers as any)['x-retry-count'] = 0;
    }
    return config;
  });

  client.interceptors.response.use(
    (response: AxiosResponse) => response,
    async (error: AxiosError) => {
      const config = error.config as AxiosRequestConfig & {
        headers: Record<string, any>;
      };

      if (!config || !config.headers) return Promise.reject(error);

      const retryCount = Number(config.headers['x-retry-count'] ?? 0);

      if (retryCount >= MAX_RETRIES || !isRetryableError(error)) {
        return Promise.reject(error);
      }

      // Exponential backoff with jitter
      const exponentialDelay = INITIAL_DELAY_MS * 2 ** retryCount;
      const jitter = Math.random() * INITIAL_DELAY_MS;
      const delay = Math.min(exponentialDelay + jitter, MAX_DELAY_MS);

      console.warn(
        `[Fortnox] Retry #${retryCount + 1} in ${Math.round(delay)}ms due to ${
          error.code ?? error.response?.status
        }`
      );

      await sleep(delay);

      config.headers['x-retry-count'] = retryCount + 1;

      return client(config);
    }
  );

  return client;
};

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
