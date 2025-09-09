import { Request, Response, NextFunction } from 'express';
import { verifyToken, JwtUserPayload } from '../services/auth.js';

declare global {
  namespace Express {
    interface Request {
      user?: JwtUserPayload;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ')
      ? authHeader.slice('Bearer '.length)
      : undefined;

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const payload = verifyToken(token);
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export function requireRole(...allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const isChair = req.user.role === 'CHAIRMAN' || req.user.role === 'CHAIRMAN_PA';
    if (!(allowedRoles.includes(req.user.role) || isChair)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
}


