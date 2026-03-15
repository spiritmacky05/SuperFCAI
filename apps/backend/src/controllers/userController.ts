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
      const email = req.headers['x-user-email'] as string;
      const users = await this.userService.listUsers();
      const user = users.find(u => u.email === email);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      res.json(user);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  };

  update = async (req: Request, res: Response) => {
    try {
      const { role, status } = req.body;
      await this.userService.updateUserRoleStatus(String(req.params.email), role, status);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  };

  delete = async (req: Request, res: Response) => {
    try {
      await this.userService.deleteUser(String(req.params.email));
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  };

  uploadProofOfPayment = async (req: Request, res: Response) => {
    try {
      const { email } = req.body;
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
      const email = String(req.params.email);
      const payments = await this.userService.getPayments(email);
      res.json(payments);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  };
}
