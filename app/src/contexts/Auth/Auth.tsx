'use client';

import { useCookies } from 'next-client-cookies';
import { jwtDecode, JwtPayload } from 'jwt-decode';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { ReactNode } from 'react';

import { redirect } from 'next/navigation';
import Client from '@/lib/client';
import { url } from '@/lib';

type LoginRequest = {
  accessToken: string;
  refreshToken: string;
  refreshTokenExpiresAt: Date | string;
};

type AuthContextValue = {
  name: string | null;
  email: string | null;
  userId: string | null;
  isAuthenticated: boolean;
  login: (req: LoginRequest) => void;
  logout: () => void;
  getAccessToken: () => Promise<string>;
};

const AuthContext = createContext<AuthContextValue>({
  login(req: LoginRequest) {},
  logout() {},
  getAccessToken: async () => Promise.any(''),
  isAuthenticated: false,
  name: null,
  email: null,
  userId: null,
});

type AuthProviderProps = {
  children: ReactNode;
  tokens: {
    accessToken: string | null | undefined;
    refreshToken: string | null | undefined;
    refreshTokenExpiresAt: string | null | undefined;
  };
};

type Jwt = JwtPayload & {
  userId: string | null;
  email: string | null;
  name: string | null;
};

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children, tokens }: AuthProviderProps) {
  const cookies = useCookies();

  const [accessToken, setAccessToken] = useState<string | null>(
    tokens.accessToken ?? null
  );

  const [refreshToken, setRefreshToken] = useState<string | null>(
    tokens.refreshToken ?? null
  );

  const content = useMemo(() => {
    return accessToken ? jwtDecode<Jwt>(accessToken) : null;
  }, [accessToken]);

  const getDiff = useCallback(
    () => (content ? content.exp! * 1000 - Date.now() : 0),
    [content]
  );

  const login = useCallback(
    (req: LoginRequest) => {
      setAccessToken(req.accessToken);
      setRefreshToken(req.refreshToken);

      console.log('Setting new token');

      cookies.set('accessToken', req.accessToken, {
        secure: location.hostname !== 'localhost',
        expires: new Date(jwtDecode(req.accessToken).exp! * 1000),
      });

      cookies.set('refreshToken', req.refreshToken, {
        secure: location.hostname !== 'localhost',
        expires: new Date(req.refreshTokenExpiresAt),
      });
    },
    [cookies]
  );

  const logout = useCallback(() => {
    console.log('logout');

    setAccessToken(null);
    setRefreshToken(null);
    cookies.remove('accessToken');
    cookies.remove('refreshToken');
  }, [cookies]);

  const getAccessToken = useCallback(async () => {
    if (!accessToken) {
      redirect('/app');
    }

    if (getDiff() > 5000) {
      return accessToken;
    }
    const client = new Client(url);
    const res = await client.iam.refresh({ refreshToken: refreshToken! });

    if (!res) {
      redirect('/app');
    }

    login(res);

    return res.accessToken;
  }, [accessToken, getDiff, refreshToken, login]);

  useEffect(() => {
    if (!tokens.accessToken) {
      return;
    }

    if (!tokens.refreshToken) {
      return;
    }

    if (!tokens.refreshTokenExpiresAt) {
      return;
    }

    login({
      accessToken: tokens.accessToken!,
      refreshToken: tokens.refreshToken,
      refreshTokenExpiresAt: tokens.refreshTokenExpiresAt,
    });
  }, [tokens, login]);

  return (
    <AuthContext.Provider
      value={{
        login,
        logout,
        getAccessToken,
        name: content?.name || null,
        email: content?.email || null,
        userId: content?.sub || null,
        isAuthenticated: content?.sub ? true : false,
      }}
      children={children}
    />
  );
}
