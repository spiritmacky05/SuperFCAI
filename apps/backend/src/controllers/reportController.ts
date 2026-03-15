import { Request, Response } from 'express';
import { ReportService } from '../services/reportService.ts';

export class ReportController {
  constructor(private readonly reports: ReportService) {}

  list = async (req: Request, res: Response) => {
    try {
      const email = (String(req.query.email || req.headers['x-user-email'] || '')).toLowerCase().trim();
      if (!email) {
        return res.status(401).json({ error: 'Email identification failed' });
      }
      const data = await this.reports.listByEmail(email);
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  };

  save = async (req: Request, res: Response) => {
    try {
      const email = (req.body.email || req.headers['x-user-email'] || '').toLowerCase().trim();
      const { report } = req.body;
      if (!email) {
        return res.status(401).json({ error: 'Email identification failed' });
      }
      await this.reports.save(email, report);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  };

  getUsageAnalytics = async (req: Request, res: Response) => {
    try {
      const email = (String(req.query.email || req.headers['x-user-email'] || '')).toLowerCase().trim();
      if (!email) {
        return res.status(401).json({ error: 'Email identification failed' });
      }
      const weeklyCount = await this.reports.getWeeklyUsage(email);
      res.json({ weeklyCount });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  };
}
