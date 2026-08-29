import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { getDatabase } from '../config/database.js';

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: 'buyer' | 'seller' | 'admin' | 'moderator';
  status: 'active' | 'suspended' | 'banned';
  kycStatus: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export function authenticateToken(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;

  if (!token) {
    res.status(401).json({
      success: false,
      error: 'Аутентификация талап кылынат (Authentication token required)',
    });
    return;
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret) as { id: string; email: string; role: string };
    const db = getDatabase();
    const user = db.prepare(`
      SELECT id, email, full_name as fullName, role, status, kyc_status as kycStatus
      FROM users WHERE id = ?
    `).get(decoded.id) as AuthUser | undefined;

    if (!user) {
      res.status(401).json({
        success: false,
        error: 'Колдонуучу табылган жок (User not found)',
      });
      return;
    }

    if (user.status === 'banned') {
      res.status(403).json({
        success: false,
        error: 'Сиздин аккаунтуңуз бөгөттөлгөн (Account is banned by administration)',
      });
      return;
    }

    if (user.status === 'suspended') {
      res.status(403).json({
        success: false,
        error: 'Сиздин аккаунтуңуз убактылуу токтотулган (Account is suspended)',
      });
      return;
    }

    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({
      success: false,
      error: 'Жараксыз же мөөнөтү өткөн токен (Invalid or expired token)',
    });
  }
}

export function optionalAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;

  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret) as { id: string; email: string; role: string };
    const db = getDatabase();
    const user = db.prepare(`
      SELECT id, email, full_name as fullName, role, status, kyc_status as kycStatus
      FROM users WHERE id = ?
    `).get(decoded.id) as AuthUser | undefined;

    if (user && user.status === 'active') {
      req.user = user;
    }
  } catch {
    // Ignore invalid token in optionalAuth
  }

  next();
}

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Аутентификация талап кылынат (Authentication required)',
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: 'Бул аракетти аткарууга уруксат жок (Insufficient permissions)',
      });
      return;
    }

    next();
  };
}
