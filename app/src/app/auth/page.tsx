'use client';

import { useState } from 'react';
import { apiClient } from '../layout';
import { Sign } from 'crypto';
import { LoginForm } from './components/LoginForm';
import { SignupForm } from './components/SignupForm';

export default function Page() {
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      await apiClient.iam.signup({ email, password, displayName });
      setSuccess(true);
    } catch (err: any) {
      setError(err?.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <SignupForm
        onSubmit={async (email, displayName, password) =>
          await apiClient.iam.signup({
            email,
            displayName,
            password,
          })
        }
      />
      <LoginForm
        onSubmit={async (email, password) =>
          await apiClient.iam.login({
            email,
            password,
          })
        }
      />
    </div>
  );
}
