import { Request, Response } from 'express';
import { env } from '../config/env.ts';
import { DB } from '../db/database.ts';
import { AiService } from '../services/aiService.ts';

export class HealthController {
  constructor(
    private readonly db: DB,
    private readonly aiService: AiService,
  ) {}

  getHealth = (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      env: env.nodeEnv,
      db: !!this.db,
      ai: this.aiService.health(),
    });
  };
}
