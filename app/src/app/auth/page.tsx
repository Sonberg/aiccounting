'use client';

import { encore } from '@/lib';
import { LoginForm } from './components/LoginForm';
import { SignupForm } from './components/SignupForm';
import { signIn, useSession } from 'next-auth/react';

export default function Page() {
  const session = useSession();

  console.log(session);

  return (
    <div>
      <pre className="w-4/3">
        {session.status === 'authenticated'
          ? JSON.stringify(session.data.user, null, 2)
          : 'Not authenticated'}
      </pre>

      <SignupForm
        onSubmit={async (email, displayName, password) =>
          await encore.iam.signup({
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

          await encore.iam.getUserMe();

          return res;
        }}
      />
    </div>
  );
}
