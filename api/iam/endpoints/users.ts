import { api } from 'encore.dev/api';
import { getAuthData } from '~encore/auth';
import { db } from '@/database';

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
    const userId = getAuthData()!.userID;
    const user = await db.queryRow<User>`
        SELECT *
        FROM users
        WHERE id = ${Number(userId)}
      `;

    return {
      data: user,
    };
  }
);
