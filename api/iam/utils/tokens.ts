import jwt from 'jsonwebtoken';
import { User } from '../types';
import { JWT_SECRET } from '../secrets';
import { createHash, randomBytes } from 'crypto';

export function createAccessToken(user: User): string {
  return jwt.sign(
    { sub: user.id, name: user.display_name, email: user.email },
    JWT_SECRET(),
    {
      expiresIn: '1h',
    }
  );
}

export function createRefreshToken() {
  return randomBytes(64).toString('hex');
}

export function hashRefreshToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
