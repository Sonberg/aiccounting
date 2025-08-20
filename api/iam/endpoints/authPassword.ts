import { pbkdf2Sync, randomBytes } from 'crypto';
import { api } from 'encore.dev/api';

import { db, setRefreshToken } from '../database';
import { User } from '../types';
import { createAccessToken, createRefreshToken } from '../helpers/tokens';
import dayjs from 'dayjs';

interface LoginRequest {
  email: string;
  password: string;
}

interface LoginResponse {
  success: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  refreshTokenExpiresAt: string | null;
  user: User | null;
}

interface UserAuth extends User {
  password_hash: string;
  password_salt: string;
}

function hashPassword(password: string, salt: string): string {
  return pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
}

export const login = api<LoginRequest, LoginResponse>(
  {
    path: '/auth/login',
    method: 'POST',
    expose: true,
  },
  async (req) => {
    const row = await db.queryRow<UserAuth>`
    SELECT u.*, ap.password_hash, ap.password_salt
    FROM users u
    JOIN auth_passwords ap ON ap.user_id = u.id
    WHERE u.email = ${req.email}
  `;

    if (!row) {
      return {
        success: false,
        user: null,
        accessToken: null,
        refreshToken: null,
        refreshTokenExpiresAt: null,
      };
    }

    const { password_hash, password_salt, ...user } = row;
    const hash = hashPassword(req.password, password_salt);

    if (hash !== password_hash) {
      return {
        success: false,
        user: null,
        accessToken: null,
        refreshToken: null,
        refreshTokenExpiresAt: null,
      };
    }

    const refreshToken = createRefreshToken();
    const accessToken = createAccessToken(user);

    await setRefreshToken({
      user,
      refreshToken,
      userAgent: null,
      ipAddress: null,
      lastRefreshTokenId: null,
    });

    return {
      success: true,
      refreshTokenExpiresAt: dayjs().add(30, 'days').toISOString(),
      refreshToken: refreshToken,
      accessToken: accessToken,
      user,
    };
  }
);

interface CreateUserRequest {
  email: string;
  displayName?: string;
  password: string;
}

export const signup = api<CreateUserRequest, User>(
  {
    path: '/auth/signup',
    method: 'POST',
    expose: true,
  },
  async (req) => {
    const salt = randomBytes(16).toString('hex');
    const hash = hashPassword(req.password, salt);
    const transaction = await db.begin();

    try {
      const user = await transaction.queryRow<User>`
        INSERT INTO users (email, display_name)
        VALUES (${req.email}, ${req.displayName || null})
        RETURNING id, email, display_name, created_at
    `;

      await transaction.exec`
        INSERT INTO auth_passwords (user_id, password_hash, password_salt, password_algo)
        VALUES (${user!.id}, ${hash}, ${salt}, 'pbkdf2-sha512')
  `;

      await transaction.commit();

      return user!;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
);
