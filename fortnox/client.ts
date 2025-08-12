import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
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

const MAX_RETRIES = 10;
const INITIAL_DELAY_MS = 1000;

export const getFortnoxClient = (token: Token) => {
  const client = axios.create({
    baseURL: 'https://api.fortnox.se/',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token.accessToken}`,
    },
  });

  client.interceptors.request.use((config) => {
    if (!config.headers['x-retry-count']) {
      config.headers['x-retry-count'] = 0;
    }

    return config;
  });

  // Response interceptor to handle 429 errors and retry
  client.interceptors.response.use(
    (response: AxiosResponse) => response, // pass successful responses through
    async (error: AxiosError) => {
      const config = error.config as AxiosRequestConfig & { headers: unknown };

      if (!config || !config.headers) return Promise.reject(error);

      // Check if it's a 429 error
      if (error.response?.status === 429) {
        // Parse current retry count (number)
        const retryCount = Number(config.headers['x-retry-count']) || 0;

        if (retryCount >= MAX_RETRIES) {
          // Exceeded max retries — reject
          return Promise.reject(error);
        }

        // Calculate delay (exponential backoff)
        const delay = INITIAL_DELAY_MS * Math.pow(2, retryCount);

        console.warn(
          `Rate limited by Fortnox API. Retry #${retryCount + 1} in ${delay}ms`
        );

        // Wait before retrying
        await new Promise((resolve) => setTimeout(resolve, delay));

        // Increment retry count
        config.headers['x-retry-count'] = retryCount + 1;

        // Retry the request
        return client(config);
      }

      // Other errors — reject immediately
      return Promise.reject(error);
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
