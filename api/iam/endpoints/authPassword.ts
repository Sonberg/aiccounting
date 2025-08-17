import { pbkdf2Sync, randomBytes } from 'crypto';
import jwt from 'jsonwebtoken';

import { api } from 'encore.dev/api';
import { db } from '../database';
import { User } from '../types';
import { JWT_SECRET } from '../secrets';

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
  email: string;
  display_name: string;
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
    const user = await db.queryRow<UserAuth>`
    SELECT u.id, u.display_name, u.email, ap.password_hash, ap.password_salt
    FROM users u
    JOIN auth_passwords ap ON ap.user_id = u.id
    WHERE u.email = ${req.email}
  `;

    if (!user) {
      return { success: false };
    }

    const { id, display_name, email, password_hash, password_salt } = user;
    const hash = hashPassword(req.password, password_salt);

    if (hash !== password_hash) {
      return { success: false };
    }

    return {
      success: true,
      token: jwt.sign({ sub: id, name: display_name, email }, JWT_SECRET(), {
        expiresIn: '1h',
      }),
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
  }
);
