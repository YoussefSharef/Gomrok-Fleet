import jwt from 'jsonwebtoken';
import type { AuthedPerson } from './types.js';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-only-secret-change-me';

export function signToken(person: AuthedPerson): string {
  return jwt.sign(person, JWT_SECRET, { expiresIn: '30d' });
}

export function verifyToken(token: string): AuthedPerson | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AuthedPerson;
  } catch {
    return null;
  }
}
