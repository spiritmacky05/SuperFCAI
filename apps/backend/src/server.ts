import { env } from './config/env.ts';
import { SQLiteDB } from './db/database.ts';
import { buildContainer } from './container.ts';
import { createApp } from './app.ts';

async function bootstrap() {
  try {
    console.log('Starting server initialization...');
    console.log(`Configured PORT: ${env.port}`);
    console.log('Using SQLite database (local)');

    const db = new SQLiteDB(env.dbFilePath);
    await db.init();

    const container = buildContainer(db);
    const app = createApp(container);

    const server = app.listen(env.port, '0.0.0.0', () => {
      console.log(`Server is running on http://localhost:${env.port}`);
      console.log(`Environment: ${env.nodeEnv}`);
      console.log(`PayMongo Key Configured: ${!!env.paymongoSecretKey}`);
      console.log(`PayMongo Webhook Secret Configured: ${!!env.paymongoWebhookSecret}`);
      console.log(`Gemini API Key Configured: ${!!env.geminiApiKey}`);
      console.log(`Database URL Configured: ${!!process.env.DATABASE_URL}`);
    });

    server.on('error', (error: any) => {
      if (error?.code === 'EADDRINUSE') {
        console.error(`Port ${env.port} is already in use. Stop the existing backend process and try again.`);
      } else {
        console.error('Server runtime error:', error);
      }
      process.exit(1);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

bootstrap();
