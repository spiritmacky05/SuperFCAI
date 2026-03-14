import { Request, Response } from 'express';
import { AiService } from '../services/aiService.ts';

export class AiController {
  constructor(private readonly aiService: AiService) {}

  generateContent = async (req: Request, res: Response) => {
    try {
      const text = await this.aiService.generateContent(req.body.prompt);
      res.json({ text });
    } catch (err: any) {
      const status = String(err.message || '').includes('not configured') ? 503 : 500;
      res.status(status).json({ error: `AI Generation Error: ${err.message || 'Failed to generate content'}` });
    }
  };

  generateFireSafetyReport = async (req: Request, res: Response) => {
    try {
      const markdown = await this.aiService.generateFireSafetyReport(req.body.params);
      res.json({ markdown });
    } catch (err: any) {
      const status = String(err.message || '').includes('not configured') ? 503 : 500;
      res.status(status).json({ error: `AI Generation Error: ${err.message || 'Failed to generate fire safety report'}` });
    }
  };

  createChatSession = async (_req: Request, res: Response) => {
    if (!this.aiService.health()) {
      return res.status(503).json({ error: 'AI service not configured' });
    }
    res.json({ message: 'Chat session ready' });
  };

  sendMessage = async (req: Request, res: Response) => {
    try {
      const { message, history } = req.body;
      if (!message || typeof message !== 'string' || !message.trim()) {
        return res.status(400).json({ error: 'Message is required' });
      }

      const text = await this.aiService.sendMessage(message, history || []);
      res.json({ text });
    } catch (err: any) {
      const status = String(err.message || '').includes('not configured') ? 503 : 500;
      res.status(status).json({ error: `AI Chat Error: ${err.message || 'Failed to send message'}` });
    }
  };

  generateNTC = async (req: Request, res: Response) => {
    try {
      const { params, violations } = req.body;
      const text = await this.aiService.generateNTC(params, violations);
      res.json({ text });
    } catch (err: any) {
      const status = String(err.message || '').includes('not configured') ? 503 : 500;
      res.status(status).json({ error: `AI Generation Error: ${err.message || 'Failed to generate NTC'}` });
    }
  };
}
