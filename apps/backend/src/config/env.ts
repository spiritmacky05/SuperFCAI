import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({
  path: path.resolve(__dirname, '../../../../.env'),
  override: true,
});

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3001', 10),
  dbFilePath: process.env.DB_FILE || 'database.sqlite',
  corsOrigins: process.env.CORS_ORIGINS || '',
  rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || '300', 10),
  authRateLimitMax: parseInt(process.env.AUTH_RATE_LIMIT_MAX || '20', 10),
  geminiApiKey: process.env.GEMINI_API_KEY,
  paymongoSecretKey: process.env.PAYMONGO_SECRET_KEY,
  paymongoWebhookSecret: process.env.PAYMONGO_WEBHOOK_SECRET,
  paymongoPaymentMethodTypes: process.env.PAYMONGO_PAYMENT_METHOD_TYPES || '',
  smtpHost: process.env.SMTP_HOST || 'smtp.ethereal.email',
  smtpPort: parseInt(process.env.SMTP_PORT || '587', 10),
  smtpUser: process.env.SMTP_USER,
  smtpPass: process.env.SMTP_PASS,
};
