import axios from 'axios';
import { secret } from 'encore.dev/config';

const username = secret('KLARNA_USERNAME')();
const password = secret('KLARNA_PASSWORD')();

export const KlarnaRestClient = axios.create({
  baseURL: 'https://api.klarna.com',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`,
  },
});
