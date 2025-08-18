import { api } from 'encore.dev/api';
import { db, getUserById, setRefreshToken } from '../database';
import {
  createAccessToken,
  createRefreshToken,
  hashRefreshToken,
} from '../utils/tokens';

interface AuthRefreshToken {
  id: number;
  user_id: number;
  token_hash: string;
  created_at: Date;
  expires_at: Date;
  revoked_at: Date | null;
  user_agent: string | null;
  ip_address: string | null;
}

interface AuthRefreshRequest {
  refreshToken: string;
  userAgent?: string;
  ipAddress?: string;
}

interface AuthRefreshResponse {
  accessToken: string;
  refreshToken?: string; // if you do rotation
}

export const refresh = api<AuthRefreshRequest, AuthRefreshResponse>(
  { expose: true, method: 'POST', path: '/auth/refresh' },
  async ({ refreshToken, userAgent, ipAddress }) => {
    const hashed = hashRefreshToken(refreshToken);

    // Check token in DB
    const token = await db.queryRow<AuthRefreshToken>`
      SELECT * FROM auth_refresh_tokens
      WHERE token_hash = ${hashed}
      LIMIT 1
    `;

    if (!token) {
      throw new Error('Invalid refresh token');
    }

    if (token.revoked_at) {
      throw new Error('Refresh token revoked');
    }

    if (new Date(token.expires_at) < new Date()) {
      throw new Error('Refresh token expired');
    }

    const user = await getUserById(token.user_id);
    if (!user) {
      throw new Error('User not found');
    }

    const accessToken = createAccessToken(user);
    const newRefreshToken = createRefreshToken();

    await setRefreshToken({
      user,
      refreshToken,
      userAgent: userAgent || null,
      ipAddress: ipAddress || null,
      lastRefreshTokenId: token.id,
    });

    return {
      accessToken,
      refreshToken: newRefreshToken,
    };
  }
);
