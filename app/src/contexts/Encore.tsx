'use client';

import { createContext, ReactNode, useContext, useMemo } from 'react';
import Client, { Local } from '@/lib/client';
import { useSession } from 'next-auth/react';
import { Session } from 'next-auth';

type EncoreContextType = {
  client: Client;
};

const EncoreContext = createContext<EncoreContextType>({
  client: null!,
});

type EncoreSession = Session & {
  accessToken?: string | null;
  status: 'authenticated' | string;
};

export function useEncore() {
  const context = useContext(EncoreContext);

  if (!context) {
    throw new Error('useEncore must be used within an EncoreProvider');
  }
  return context;
}

export function EncoreProvider({ children }: { children: ReactNode }) {
  const session = useSession() as unknown as EncoreSession;
  const client = useMemo(
    () =>
      new Client(Local, {
        auth: {
          authorization:
            session?.status === 'authenticated' && session?.accessToken
              ? `Bearer ${session.accessToken}`
              : '',
        },
      }),
    [session.accessToken, session.status]
  );
  return (
    <EncoreContext.Provider value={{ client }}>
      {children}
    </EncoreContext.Provider>
  );
}
