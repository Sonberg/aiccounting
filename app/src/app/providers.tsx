'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { EncoreProvider } from '../contexts/Encore';
import { AuthProvider } from '../contexts/Auth';

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
  tokens: {
    accessToken: string | null | undefined;
    refreshToken: string | null | undefined;
    refreshTokenExpiresAt: string | null | undefined;
  };
  children: ReactNode;
};

export default function Providers({ tokens, children }: Props) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider tokens={tokens}>
        <EncoreProvider>{children}</EncoreProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
