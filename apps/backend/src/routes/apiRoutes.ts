import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { AppContainer } from '../container.ts';
import { authRateLimit } from '../middleware/security.ts';

// Configure multer for file uploads
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.resolve(__dirname, '../../uploads');

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

  router.get('/users', user.list);
  router.post('/users', user.upsert);
  router.post('/login', authRateLimit, user.login);
  router.put('/users/:email', user.update);
  router.delete('/users/:email', user.delete);
  router.post('/users/upload-proof-of-payment', upload.single('proof'), user.uploadProofOfPayment);

  router.get('/reports', report.list);
  router.post('/reports', report.save);

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
