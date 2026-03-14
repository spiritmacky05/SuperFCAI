import { Request, Response } from 'express';
import { KnowledgeService } from '../services/knowledgeService.ts';

export class KnowledgeController {
  constructor(private readonly knowledge: KnowledgeService) {}

  list = async (_req: Request, res: Response) => {
    try {
      const rows = await this.knowledge.list();
      res.json(rows);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  };

  save = async (req: Request, res: Response) => {
    try {
      await this.knowledge.save(req.body);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  };

  delete = async (req: Request, res: Response) => {
    try {
      await this.knowledge.delete(String(req.params.id));
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  };
}
