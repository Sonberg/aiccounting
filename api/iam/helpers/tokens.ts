import jwt from 'jsonwebtoken';
import { User } from '../types';
import { JWT_SECRET } from '../secrets';
import { createHash, randomBytes } from 'crypto';

const EXPIRES_IN = 2 * 60 * 1000; // 2 minutes

export function createAccessToken(user: User) {
  return jwt.sign(
    { sub: user.id.toString(), email: user.email, name: user.display_name },
    JWT_SECRET(),
    { expiresIn: EXPIRES_IN }
  );
}

export function createRefreshToken() {
  return randomBytes(64).toString('hex');
}

export function hashRefreshToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
