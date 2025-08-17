import * as crypto from 'crypto';
import * as jwt from 'jsonwebtoken';
import { api } from 'encore.dev/api';
import { db } from '../database';
interface LoginRequest {
  email: string;
  password: string;
}

interface LoginResponse {
  success: boolean;
  token?: string;
}

interface UserAuth {
  id: string;
  password_hash: string;
  password_salt: string;
}

const JWT_SECRET = 'test';

function hashPassword(password: string, salt: string): string {
  return crypto
    .pbkdf2Sync(password, salt, 100000, 64, 'sha512')
    .toString('hex');
}

export const login = api<LoginRequest, LoginResponse>(
  {
    path: '/auth/login',
    method: 'POST',
    auth: false,
  },
  async (req) => {
    const userResult = await db.queryAll<UserAuth>`
    SELECT u.id, ap.password_hash, ap.password_salt
    FROM users u
    JOIN auth_passwords ap ON ap.user_id = u.id
    WHERE u.email = ${req.email}
  `;

    if (userResult.length === 0) {
      return { success: false };
    }

    const { id, password_hash, password_salt } = userResult[0];
    const hash = hashPassword(req.password, password_salt);

    if (hash !== password_hash) {
      return { success: false };
    }

    return {
      success: true,
      token: jwt.sign({ sub: id }, JWT_SECRET, { expiresIn: '1h' }),
    };
  }
);
