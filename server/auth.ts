import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import type { Request, Response, NextFunction } from 'express';
import { db } from './db.ts';

function resolveJwtSecret(): string {
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.trim().length >= 16) {
    return process.env.JWT_SECRET.trim();
  }
  const secretFile = path.resolve(process.cwd(), '.jwt-secret');
  if (fs.existsSync(secretFile)) {
    return fs.readFileSync(secretFile, 'utf-8').trim();
  }
  const generated = crypto.randomBytes(48).toString('hex');
  fs.writeFileSync(secretFile, generated, { mode: 0o600 });
  return generated;
}

const JWT_SECRET = resolveJwtSecret();

export interface AuthPayload {
  userId: string;
  email: string;
}

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    fullName: string;
  };
}

export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 10);
}

export function verifyPassword(password: string, hash: string): boolean {
  return bcrypt.compareSync(password, hash);
}

export function signAuthToken(payload: AuthPayload, rememberMe: boolean): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: rememberMe ? '30d' : '24h',
  });
}

export function verifyAuthToken(token: string): AuthPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthPayload;
    if (!decoded || typeof decoded.userId !== 'string') return null;
    return decoded;
  } catch {
    return null;
  }
}

export function extractTokenFromRequest(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const bearer = authHeader.slice(7).trim();
    if (bearer) return bearer;
  }
  const cookieToken = (req as Request & { cookies?: Record<string, string> }).cookies?.sb_token;
  if (cookieToken) return cookieToken;
  return null;
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const token = extractTokenFromRequest(req);
  if (!token) {
    return res.status(401).json({ error: 'Authentication required. Please log in.' });
  }
  const payload = verifyAuthToken(token);
  if (!payload) {
    return res.status(401).json({ error: 'Session expired or invalid. Please log in again.' });
  }
  const userRow = db
    .prepare('SELECT id, email, full_name FROM users WHERE id = ?')
    .get(payload.userId) as { id: string; email: string; full_name: string } | undefined;

  if (!userRow) {
    return res.status(401).json({ error: 'Account not found. Please log in again.' });
  }

  req.user = {
    id: userRow.id,
    email: userRow.email,
    fullName: userRow.full_name,
  };
  next();
}

export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function validatePasswordStrength(password: string): string | null {
  if (password.length < 8) {
    return 'Password must be at least 8 characters long.';
  }
  if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
    return 'Password must include at least one letter and one number.';
  }
  return null;
}
