import { api } from 'encore.dev/api';
import { db } from '../database';
import { pbkdf2Sync, randomBytes } from 'crypto';

interface CreateUserRequest {
  email: string;
  displayName?: string;
  password: string;
  tenantId: string;
  role?: string;
}

interface User {
  id: string;
  email: string;
  display_name: string;
  created_at: string;
}

function hashPassword(password: string, salt: string): string {
  return pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
}

export const createUser = api(
  {
    path: '/users',
    method: 'POST',
    auth: false,
  },
  async (req: CreateUserRequest): Promise<User> => {
    const salt = randomBytes(16).toString('hex');
    const hash = hashPassword(req.password, salt);
    const transaction = await db.begin();

    const userResult = await transaction.queryRow<User>`
        INSERT INTO users (email, display_name)
        VALUES (${req.email}, ${req.displayName || null})
        RETURNING id, email, display_name, created_at
    `;

    const user = userResult!;

    await transaction.exec`
        INSERT INTO auth_passwords (user_id, password_hash, password_salt, password_algo)
        VALUES (${user.id}, ${hash}, ${salt}, 'pbkdf2-sha512')
  `;

    await transaction.exec`
        INSERT INTO user_tenants (user_id, tenant_id, role)
        VALUES (${user.id}, ${req.tenantId}, ${req.role || 'member'})
  `;

    await transaction.commit();

    return user;
  }
);
