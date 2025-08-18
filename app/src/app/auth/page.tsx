'use client';

import { useEncore } from '@/contexts/Encore';
import { LoginForm } from './components/LoginForm';
import { SignupForm } from './components/SignupForm';
import { signIn, useSession } from 'next-auth/react';

export default function Page() {
  const session = useSession();
  const { client } = useEncore();

  return (
    <div>
      <pre className="w-4/3">
        {session.status === 'authenticated'
          ? JSON.stringify(session.data.user, null, 2)
          : 'Not authenticated'}
      </pre>

      <SignupForm
        onSubmit={async (email, displayName, password) =>
          await client.iam.signup({
            email,
            displayName,
            password,
          })
        }
      />
      <LoginForm
        onSubmit={async (email, password) => {
          const res = await signIn('credentials', {
            email,
            password,
            redirect: false,
          });

          console.log(res);

          await client.iam.getUserMe();

          return res;
        }}
      />
    </div>
  );
}
