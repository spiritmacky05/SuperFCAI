import { Request, Response } from 'express';
import { ReportService } from '../services/reportService.ts';

export class ReportController {
  constructor(private readonly reports: ReportService) {}

  list = async (req: Request, res: Response) => {
    try {
      const email = String(req.query.email || '');
      const data = await this.reports.listByEmail(email);
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  };

  save = async (req: Request, res: Response) => {
    try {
      const { email, report } = req.body;
      await this.reports.save(email, report);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  };
}
