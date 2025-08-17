import { getServerSession } from 'next-auth/next';
import Client, { Local } from './client';
import { authOptions } from '@/auth';

export async function getEncoreClient() {
  const session = (await getServerSession(authOptions)) as any;

  return new Client(Local, {
    auth: {
      authorization: session?.accessToken
        ? `Bearer ${session.accessToken}`
        : '',
    },
  });
}
