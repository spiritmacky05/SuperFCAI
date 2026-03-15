import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createApiRouter } from './routes/apiRoutes.ts';
import { AppContainer } from './container.ts';
import { env } from './config/env.ts';
import {
  apiRateLimit,
  corsMiddleware,
  disablePoweredBy,
  errorHandler,
  helmetMiddleware,
} from './middleware/security.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const createApp = (container: AppContainer) => {
  const app = express();

  app.disable('x-powered-by');
  app.use(disablePoweredBy);
  app.use(helmetMiddleware);

  // Must stay before express.json() for webhook signature verification.
  app.post('/api/paymongo/webhook', express.raw({ type: 'application/json' }), container.controllers.paymongo.webhook);

  app.use(express.json({ limit: '2mb' }));
  app.use('/api', corsMiddleware);
  app.use('/api', apiRateLimit);
  app.use('/api', createApiRouter(container));

  const uploadsPath = path.resolve(__dirname, '../uploads');
  app.use('/uploads', express.static(uploadsPath));

  if (env.nodeEnv === 'production') {
    const frontendDistPath = path.resolve(__dirname, '../../frontend/dist');
    app.use(express.static(frontendDistPath));

    app.get(/(.*)/, (_req, res) => {
      res.sendFile(path.join(frontendDistPath, 'index.html'));
    });
  }

  app.use(errorHandler);

  return app;
};
