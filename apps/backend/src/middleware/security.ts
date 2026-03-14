import { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { env } from '../config/env.ts';

const normalizeOrigin = (origin: string) => origin.trim().replace(/\/$/, '');

const extractHost = (value: string) =>
  value
    .trim()
    .replace(/^https?:\/\//, '')
    .replace(/\/.*$/, '')
    .toLowerCase();

const defaultAllowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
];

const configuredOrigins = (env.corsOrigins || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

const domainHost = extractHost(env.domain || '');
const domainOrigins = domainHost
  ? [`https://${domainHost}`, `http://${domainHost}`]
  : [];

const allowedOrigins = new Set([...defaultAllowedOrigins, ...domainOrigins, ...configuredOrigins].map(normalizeOrigin));

export const corsMiddleware = cors({
  origin(origin, callback) {
    if (!origin) return callback(null, true); // non-browser clients
    if (allowedOrigins.has(normalizeOrigin(origin))) {
      return callback(null, true);
    }
    return callback(new Error('CORS policy: origin not allowed'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 600,
});

export const helmetMiddleware = helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
});

export const apiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: env.rateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please try again later.' },
});

export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: env.authRateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts. Please try again later.' },
});

export const disablePoweredBy = (_req: Request, res: Response, next: NextFunction) => {
  res.removeHeader('X-Powered-By');
  next();
};

export const errorHandler = (err: any, _req: Request, res: Response, _next: NextFunction) => {
  if (String(err?.message || '').includes('CORS policy')) {
    return res.status(403).json({ error: 'Forbidden origin' });
  }

  const isProduction = env.nodeEnv === 'production';
  const message = isProduction ? 'Internal server error' : err?.message || 'Internal server error';
  return res.status(500).json({ error: message });
};
