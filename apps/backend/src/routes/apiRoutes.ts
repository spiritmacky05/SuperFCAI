import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { AppContainer } from '../container.ts';
import { authRateLimit } from '../middleware/security.ts';

// Configure multer for file uploads
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.resolve(__dirname, '../../uploads');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const upload = multer({ storage: storage });

export const createApiRouter = (container: AppContainer) => {
  const router = Router();
  const { user, report, knowledge, errorReport, paymongo, ai, health } = container.controllers;

  router.get('/health', health.getHealth);
  router.get('/diag/db-health', container.controllers['diag'].getDbHealth);

  router.get('/users', user.list);
  router.post('/users', user.upsert);
  router.get('/users/:email', user.loginStatus);
  router.get('/me', user.me);
  router.get('/me/payments', user.getMePayments);
  router.get('/login/status', user.loginStatus);
  router.post('/login', authRateLimit, user.login);
  router.put('/users/:email', user.update);
  router.delete('/users/:email', user.delete);
  router.post('/forgot-password', authRateLimit, user.forgotPassword);
  router.post('/reset-password', authRateLimit, user.resetPassword);
  router.post('/users/upload-proof-of-payment', upload.single('proof'), user.uploadProofOfPayment);
  router.get('/users/:email/payments', user.getPayments);

  router.get('/reports', report.list);
  router.post('/reports', report.save);
  router.get('/usage-analytics', report.getUsageAnalytics);

  router.get('/knowledge', knowledge.list);
  router.post('/knowledge', knowledge.save);
  router.delete('/knowledge/:id', knowledge.delete);

  router.get('/error-reports', errorReport.list);
  router.post('/error-reports', errorReport.create);
  router.patch('/error-reports/:id/status', errorReport.updateStatus);
  router.delete('/error-reports/:id', errorReport.delete);

  router.post('/paymongo/create-checkout', paymongo.createCheckout);

  router.post('/generateContent', ai.generateContent);
  router.post('/generateFireSafetyReport', ai.generateFireSafetyReport);
  router.post('/createChatSession', ai.createChatSession);
  router.post('/sendMessage', ai.sendMessage);
  router.post('/generateNTC', ai.generateNTC);

  return router;
};
