import { decode } from 'jsonwebtoken';

export const isTokenValid = (accessToken: string) => {
  const decoded = decode(accessToken, { complete: true });

  if (!decoded || typeof decoded !== 'object') {
    return false;
  }

  const payload = decoded.payload as { exp?: number };

  if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) {
    return false;
  } else {
    return true;
  }
};
