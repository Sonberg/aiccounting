import { User } from './types';
import { hashRefreshToken } from './helpers/tokens';
import { db } from '@/database';

// export const db = new SQLDatabase('iam', {
//   migrations: './migrations',
// });

interface SetRefreshTokenArgs {
  user: User;
  refreshToken: string;
  userAgent: string | null;
  ipAddress: string | null;
  lastRefreshTokenId: number | null;
}

export async function setRefreshToken(args: SetRefreshTokenArgs) {
  const { user, refreshToken, userAgent, ipAddress, lastRefreshTokenId } = args;
  const tx = await db.begin();
  const newHash = hashRefreshToken(refreshToken);

  try {
    if (lastRefreshTokenId) {
      await tx.exec`
        UPDATE auth_refresh_tokens
        SET revoked_at = NOW()
        WHERE id = ${lastRefreshTokenId}
      `;
    }

    await tx.exec`
      INSERT INTO auth_refresh_tokens (user_id, token_hash, expires_at, user_agent, ip_address)
      VALUES (
      ${user.id}, 
      ${newHash},
       NOW() + interval '30 days', 
       ${userAgent || null}, 
       ${ipAddress || null})
    `;

    await tx.commit();
  } catch (error) {
    await tx.rollback();
    throw error;
  }
}

export async function getUserById(id: number): Promise<User | null> {
  const user = await db.queryRow<User>`
    SELECT *
    FROM users
    WHERE id = ${id}
  `;

  return user || null;
}
