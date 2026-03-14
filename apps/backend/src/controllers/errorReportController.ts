import { Request, Response } from 'express';
import { ErrorReportService } from '../services/errorReportService.ts';

export class ErrorReportController {
  constructor(private readonly reports: ErrorReportService) {}

  list = async (_req: Request, res: Response) => {
    try {
      const data = await this.reports.list();
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  };

  create = async (req: Request, res: Response) => {
    try {
      const result = await this.reports.create(req.body);
      res.status(result.status).json(result.payload);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  };

  updateStatus = async (req: Request, res: Response) => {
    try {
      await this.reports.updateStatus(String(req.params.id), req.body.status);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  };

  delete = async (req: Request, res: Response) => {
    try {
      await this.reports.delete(String(req.params.id));
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  };
}
