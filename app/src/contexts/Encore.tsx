'use client';

import { createContext, ReactNode, useCallback, useContext } from 'react';
import Client, { endpoints, Local } from '@/lib/client';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from './Auth';

type EncoreContextType = {
  getClient: () => Promise<Client>;
  user: endpoints.User | null;
  isAuthenticated: boolean;
};

const EncoreContext = createContext<EncoreContextType>({
  getClient() {
    throw new Error('getClient must be implemented');
  },
  user: null,
  isAuthenticated: false,
});

export function useEncore() {
  const context = useContext(EncoreContext);

  if (!context) {
    throw new Error('useEncore must be used within an EncoreProvider');
  }
  return context;
}

export function EncoreProvider({ children }: { children: ReactNode }) {
  const auth = useAuth();

  console.log(auth);

  const getClient = useCallback(
    async () =>
      new Client(Local, {
        auth: {
          authorization: auth.isAuthenticated
            ? `Bearer ${await auth?.getAccessToken()}`
            : '',
        },
      }),
    [auth.isAuthenticated, auth.getAccessToken]
  );

  const me = useQuery({
    queryKey: ['iam', 'me'],
    queryFn: () =>
      getClient()
        .then((client) => client.iam.getUserMe())
        .then((res) => res.data),
    enabled: auth.isAuthenticated,
    placeholderData: null,
  });

  return (
    <EncoreContext.Provider
      children={children}
      value={{
        getClient,
        user: me.data || null,
        isAuthenticated: auth.isAuthenticated,
      }}
    />
  );
}
