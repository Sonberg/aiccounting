import Client, { Local } from './client';
import { getAuth } from '../contexts/Auth';

export const url = Local;
export async function getEncoreClient() {
  const auth = await getAuth();

  return new Client(url, {
    auth: {
      authorization: auth?.accessToken ? `Bearer ${auth.accessToken}` : '',
    },
  });
}
