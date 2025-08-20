import { Header, Gateway, APIError } from 'encore.dev/api';
import { authHandler } from 'encore.dev/auth';
import { User } from './types';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from './secrets';
import { db } from './database';
import { log } from 'node:console';

interface AuthRequest {
  authorization: Header<'Authorization'>;
}

interface AuthResponse {
  userID: string;
}

export const auth = authHandler<AuthRequest, AuthResponse>(async (params) => {
  const token = params.authorization.replace('Bearer ', '');

  if (!token) {
    throw APIError.unauthenticated('no token provided');
  }

  const userID = await new Promise<number>((resolve, reject) => {
    jwt.verify(token, JWT_SECRET(), (err, decoded) => {
      if (err) {
        log('JWT verification error:', err);
        throw APIError.unauthenticated('Invalid token');
      }

      if (!decoded || typeof decoded !== 'object' || !('sub' in decoded)) {
        throw APIError.unauthenticated('Invalid token structure');
      }

      resolve(Number(decoded.sub));
    });
  });

  const user = await db.queryRow<User>`
    SELECT *
    FROM users
    WHERE id = ${userID}
  `;

  if (!user) {
    throw APIError.unauthenticated('User not found');
  }

  return {
    userID: `${userID}`,
  };
});

export const gateway = new Gateway({
  authHandler: auth,
});
