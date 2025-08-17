import { AuthOptions, getServerSession } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import Client, { Local } from '@/lib/client';

const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const client = new Client(Local);
        const res = await client.iam.login({
          email: credentials!.email!,
          password: credentials!.password,
        });

        if (!res?.success) {
          return null;
        }

        return {
          ...(res.user || null),
          id: `${res.user?.id || ''}`,
          accessToken: res.accessToken || null,
          refreshToken: res.refreshToken || null,
          expiresIn: 35000, // 1 hour
        };
      },
    }),
  ],
  session: { strategy: 'jwt' },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.accessToken = user.accessToken!;
        token.refreshToken = user.refreshToken;
        token.expiresAt = Date.now() + user.expiresIn * 1000;
        return token;
      }

      if (Date.now() > (token.expiresAt as number)) {
        try {
          const res = await fetch(
            `${process.env.ENCORE_API_URL}/auth/refresh`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ refresh_token: token.refreshToken }),
            }
          );

          const data = await res.json();
          if (!res.ok) throw data;

          token.accessToken = data.access_token;
          token.expiresAt = Date.now() + data.expires_in * 1000;
        } catch (err) {
          console.error('Refresh failed', err);
          return { ...token, error: 'RefreshAccessTokenError' };
        }
      }

      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken;
      session.error = token.error;
      return session;
    },
  },
};

/**
 * Helper function to get the session on the server without having to import the authOptions object every single time
 * @returns The session object or null
 */
const getSession = () => getServerSession(authOptions);

export { authOptions, getSession };
