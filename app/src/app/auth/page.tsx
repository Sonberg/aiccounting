'use client';

import { useEncore } from '@/contexts/Encore';
import { LoginForm } from './components/LoginForm';
import { SignupForm } from './components/SignupForm';
import { useAuth } from '../../contexts/Auth';

export default function Page() {
  const { login } = useAuth();
  const { user, isAuthenticated, getClient } = useEncore();

  return (
    <div>
      <pre className="w-4/3">
        {isAuthenticated ? JSON.stringify(user, null, 2) : 'Not authenticated'}
      </pre>

      <SignupForm
        onSubmit={async (email, displayName, password) =>
          await getClient().then((client) =>
            client.iam.signup({
              email,
              displayName,
              password,
            })
          )
        }
      />
      <LoginForm
        onSubmit={async (email, password) => {
          const client = await getClient();
          const res = await client.iam.login({
            email,
            password,
          });

          if (!res.success) {
            return;
          }

          login({
            accessToken: res.accessToken!,
            refreshToken: res.refreshToken!,
            refreshTokenExpiresAt: res.refreshTokenExpiresAt!,
          });

          return res;
        }}
      />
    </div>
  );
}
