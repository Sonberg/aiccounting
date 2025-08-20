import { Geist, Geist_Mono } from 'next/font/google';
import { CookiesProvider } from 'next-client-cookies/server';

import Providers from './providers';
import { getAuth } from '../contexts/Auth';

import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const auth = await getAuth();

  return (
    <CookiesProvider>
      <Providers
        tokens={{
          accessToken: auth?.accessToken || null,
          refreshToken: auth?.refreshToken || null,
          refreshTokenExpiresAt: auth?.refreshTokenExpiresAt || null,
        }}
      >
        <html lang="en">
          <body
            className={`${geistSans.variable} ${geistMono.variable} antialiased`}
            children={children}
          />
        </html>
      </Providers>
    </CookiesProvider>
  );
}
