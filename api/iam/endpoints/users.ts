import { api } from 'encore.dev/api';

interface User {
  id: string;
  email: string;
  display_name: string;
  created_at: string;
}

interface GetUserMeResponse {
  data: User | null;
}

export const getUserMe = api<void, GetUserMeResponse>(
  {
    path: '/users/me',
    method: 'GET',
    auth: true,
    expose: true,
  },
  async () => {
    return {
      data: null,
    };
  }
);
