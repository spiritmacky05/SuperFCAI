import { Request, Response } from 'express';
import { DB } from '../db/database.ts';
import { env } from '../config/env.ts';

export class DiagController {
  constructor(private readonly db: DB) {}

  getDbHealth = async (_req: Request, res: Response) => {
    try {
      const userCount = await this.db.query('SELECT COUNT(*) as count FROM users');
      const latestUsers = await this.db.query('SELECT email, role, status FROM users ORDER BY rowid DESC LIMIT 5');
      const reportCount = await this.db.query('SELECT COUNT(*) as count FROM reports');
      const migrationCount = await this.db.query('SELECT COUNT(*) as count FROM schema_migrations');

      res.json({
        database: {
          path: env.dbFilePath,
          userCount: userCount[0]?.count || 0,
          reportCount: reportCount[0]?.count || 0,
          migrationCount: migrationCount[0]?.count || 0,
          latestSnapshot: latestUsers,
        },
        environment: {
          nodeEnv: env.nodeEnv,
          domain: env.domain,
          corsOrigins: env.corsOrigins,
          port: env.port
        },
        status: 'OK',
        timestamp: new Date().toISOString()
      });
    } catch (err: any) {
      res.status(500).json({ 
        status: 'ERROR', 
        error: err.message,
        stack: env.nodeEnv === 'development' ? err.stack : undefined
      });
    }
  };
}
