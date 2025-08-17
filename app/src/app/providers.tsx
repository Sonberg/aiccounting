'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { Session } from 'next-auth';
import { SessionProvider } from 'next-auth/react';
import { ReactNode } from 'react';
import { EncoreProvider } from '../contexts/Encore';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      refetchInterval: false,
      staleTime: 0,
    },
  },
});

type Props = {
  session: Session | null;
  children: ReactNode;
};

export default function Providers({ session, children }: Props) {
  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider session={session}>
        <EncoreProvider>{children}</EncoreProvider>
      </SessionProvider>
    </QueryClientProvider>
  );
}
