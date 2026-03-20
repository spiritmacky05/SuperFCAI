import { Request, Response } from 'express';
import { UserService } from '../services/userService.ts';

export class UserController {
  constructor(private readonly userService: UserService) {}

  list = async (_req: Request, res: Response) => {
    try {
      const users = await this.userService.listUsers();
      res.json(users);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  };

  listPaginated = async (req: Request, res: Response) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = (req.query.search as string) || '';
      const roleFilter = (req.query.role as string) || 'all';
      const statusFilter = (req.query.status as string) || 'all';
      
      const result = await this.userService.getPaginatedUsers(page, limit, search, roleFilter, statusFilter);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  };

  stats = async (req: Request, res: Response) => {
    try {
      const stats = await this.userService.getUserStats();
      res.json(stats);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  };

  upsert = async (req: Request, res: Response) => {
    try {
      await this.userService.upsertUser(req.body);
      res.json({ success: true });
    } catch (err: any) {
      let message = err.message;
      if (err.message.includes('UNIQUE constraint failed')) {
        if (err.message.includes('users.email')) {
          message = 'This email address is already registered.';
        } else if (err.message.includes('users.bfp_account_number')) {
          message = 'This BFP Account Number is already associated with another profile.';
        } else {
          message = 'A record with these unique details already exists.';
        }
      }
      res.status(500).json({ error: message });
    }
  };

  login = async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      const result = await this.userService.login(email, password);
      res.status(result.status).json(result.payload);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  };

  loginStatus = async (req: Request, res: Response) => {
    try {
      const email = (req.headers['x-user-email'] as string || '').toLowerCase().trim();
      const users = await this.userService.listUsers();
      const user = users.find(u => u.email.toLowerCase() === email);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      res.json(user);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  };

  me = async (req: Request, res: Response) => {
    return this.loginStatus(req, res);
  };

  update = async (req: Request, res: Response) => {
    try {
      const email = (String(req.params.email) || '').toLowerCase().trim();
      const { role, status } = req.body;
      await this.userService.updateUserRoleStatus(email, role, status);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  };

  delete = async (req: Request, res: Response) => {
    try {
      const email = (String(req.params.email) || '').toLowerCase().trim();
      await this.userService.deleteUser(email);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  };

  uploadProofOfPayment = async (req: Request, res: Response) => {
    try {
      // Use header-based email identification consistent with the rest of the app
      const email = (req.headers['x-user-email'] as string || req.body.email || '').toLowerCase().trim();
      
      if (!email) {
        return res.status(400).json({ error: 'Email is required.' });
      }
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded.' });
      }
      const filePath = `/uploads/${req.file.filename}`;
      await this.userService.uploadProofOfPayment(email, filePath);
      res.json({ success: true, filePath });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  };

  getPayments = async (req: Request, res: Response) => {
    try {
      const email = (String(req.params.email) || '').toLowerCase().trim();
      const payments = await this.userService.getPayments(email);
      res.json(payments);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  };

  getMePayments = async (req: Request, res: Response) => {
    try {
      const email = (req.headers['x-user-email'] as string || '').toLowerCase().trim();
      const payments = await this.userService.getPayments(email);
      res.json(payments);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  };

  forgotPassword = async (req: Request, res: Response) => {
    try {
      const { email } = req.body;
      await this.userService.forgotPassword(email);
      res.json({ success: true, message: 'If an account exists, a reset link has been sent.' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  };

  resetPassword = async (req: Request, res: Response) => {
    try {
      const { token, password } = req.body;
      await this.userService.resetPassword(token, password);
      res.json({ success: true, message: 'Password has been reset successfully.' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  };
}
