import type { NextFunction, Request, Response } from 'express';
import { verifyToken } from '../auth.js';
import type { AuthedPerson, Role } from '../types.js';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      person?: AuthedPerson;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  const person = token ? verifyToken(token) : null;
  if (!person) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }
  req.person = person;
  next();
}

export function requireRole(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.person || !roles.includes(req.person.role)) {
      res.status(403).json({ error: 'Not authorized for this action' });
      return;
    }
    next();
  };
}
