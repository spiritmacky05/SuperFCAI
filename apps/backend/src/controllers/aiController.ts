import { Request, Response } from 'express';
import { AiService } from '../services/aiService.ts';
import { UserService } from '../services/userService.ts';
import { ReportService } from '../services/reportService.ts';

export class AiController {
  constructor(
    private readonly aiService: AiService,
    private readonly userService: UserService,
    private readonly reportService: ReportService
  ) {}

  generateContent = async (req: Request, res: Response) => {
    try {
      const requestedEmail = req.body.email || req.headers['x-user-email'];
      const email = typeof requestedEmail === 'string' ? requestedEmail.toLowerCase().trim() : null;
      const { prompt } = req.body;
      
      // Limit check for free users
      if (email) {
        const users = await this.userService.listUsers();
        const user = users.find(u => u.email === email);
        if (user && user.role === 'free') {
          const usage = await this.reportService.getWeeklyUsage(email);
          if (usage >= 10) { // Example limit: 10 per week
            return res.status(403).json({ error: 'Weekly limit reached for Free tier. Please upgrade to Pro for unlimited access.' });
          }
        }
      }

      const text = await this.aiService.generateContent(prompt);
      
      // Log usage for tracking
      if (email) {
        await this.reportService.save(email as string, {
          id: `usage-${Date.now()}`,
          timestamp: Date.now(),
          params: JSON.stringify({ type: 'content_generation', prompt: (req.body.prompt || '').substring(0, 50) }),
          result: 'INTERNAL_USAGE_LOG'
        });
      }

      res.json({ text });
    } catch (err: any) {
      const status = String(err.message || '').includes('not configured') ? 503 : 500;
      res.status(status).json({ error: `AI Generation Error: ${err.message || 'Failed to generate content'}` });
    }
  };

  generateFireSafetyReport = async (req: Request, res: Response) => {
    try {
      const requestedEmail = req.body.email || req.headers['x-user-email'];
      const email = typeof requestedEmail === 'string' ? requestedEmail.toLowerCase().trim() : null;
      const { params } = req.body;

      // Limit check for free users
      if (email) {
        const users = await this.userService.listUsers();
        const user = users.find(u => u.email === email);
        if (user && user.role === 'free') {
          const usage = await this.reportService.getWeeklyUsage(email);
          if (usage >= 10) {
            return res.status(403).json({ error: 'Weekly limit reached for Free tier. Please upgrade to Pro for unlimited access.' });
          }
        }
      }

      const markdown = await this.aiService.generateFireSafetyReport(params);

      // Log usage for tracking
      if (email) {
        await this.reportService.save(email as string, {
          id: `report-${Date.now()}`,
          timestamp: Date.now(),
          params: JSON.stringify({ type: 'report_generation', ...params }),
          result: 'INTERNAL_USAGE_LOG'
        });
      }

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
