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
  allowedHeaders: ['Content-Type', 'Authorization', 'X-User-Email', 'X-Session-Id'],
  maxAge: 600,
});

export const helmetMiddleware = helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: {
    directives: {
      ...helmet.contentSecurityPolicy.getDefaultDirectives(),
      "script-src": ["'self'", "'unsafe-inline'", "https://pagead2.googlesyndication.com", "https://*.google.com", "https://*.adtrafficquality.google", "https://*.googlesyndication.com"],
      "script-src-elem": ["'self'", "'unsafe-inline'", "https://pagead2.googlesyndication.com", "https://*.google.com", "https://*.adtrafficquality.google", "https://*.googlesyndication.com"],
      "frame-src": ["'self'", "https://googleads.g.doubleclick.net", "https://*.google.com", "https://*.googlesyndication.com", "https://*.adtrafficquality.google", "https://ep2.adtrafficquality.google"],
      "img-src": ["'self'", "data:", "https://pagead2.googlesyndication.com", "https://*.google.com", "https://*.googlesyndication.com"],
      "connect-src": ["'self'", "https://*.google.com", "https://*.analytics.google.com", "https://*.googlesyndication.com", "https://*.adtrafficquality.google"],
    },
  },
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

export const createSessionAuthMiddleware = (userService: any) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Relative paths since middleware is mounted on /api
    const publicPaths = ['/login', '/health', '/paymongo/webhook', '/diag/db-health'];
    const isPublic = publicPaths.includes(req.path) || (req.method === 'POST' && req.path === '/users');

    if (req.path === '/login/status') {
      console.log(`[AUTH-DEBUG] Headers for /login/status:`, {
        'x-user-email': req.headers['x-user-email'],
        'x-session-id': req.headers['x-session-id'],
        'user-agent': req.headers['user-agent']
      });
    }

    if (isPublic) {
      return next();
    }

    const email = (req.headers['x-user-email'] as string || '').toLowerCase().trim();
    const sessionId = req.headers['x-session-id'] as string;

    if (!email || !sessionId) {
      console.warn(`[AUTH] Unauthorized: Missing headers. Email: ${!!email}, Session: ${!!sessionId}`);
      return res.status(401).json({ 
        error: 'SESSION ERROR: Access ID or Session ID missing.',
        code: 'MISSING_HEADERS',
        debug: { hasEmail: !!email, hasSessionId: !!sessionId }
      });
    }

    const { isValid, reason } = await userService.verifySessionWithReason(email, sessionId);
    if (!isValid) {
      console.warn(`[AUTH] Unauthorized: ${reason} for ${email}. SessionID received: ${sessionId?.substring(0, 8)}...`);
      return res.status(401).json({ 
        error: reason === 'USER_NOT_FOUND' 
          ? 'USER ERROR: Your account was not found in the database. Please register or log in again.'
          : 'SESSION EXPIRED: Your account has been logged in on another device or session has expired.',
        code: reason,
        email: email
      });
    }

    next();
  };
};

export const errorHandler = (err: any, _req: Request, res: Response, _next: NextFunction) => {
  if (String(err?.message || '').includes('CORS policy')) {
    return res.status(403).json({ error: 'Forbidden origin' });
  }

  const isProduction = env.nodeEnv === 'production';
  if (err && !String(err.message || '').includes('CORS policy')) {
    console.error('SERVER ERROR:', err.stack || err.message || err);
  }
  const message = isProduction ? 'Internal server error' : err?.message || 'Internal server error';
  return res.status(500).json({ error: message });
};
