import nodemailer from 'nodemailer';
import { env } from '../config/env.ts';

export class EmailService {
  async sendErrorReportReceived(userEmail: string, citedError: string) {
    if (!env.smtpUser || !env.smtpPass) {
      console.log(`Email notification skipped for ${userEmail}: SMTP credentials not configured.`);
      return;
    }

    const transporter = nodemailer.createTransport({
      host: env.smtpHost,
      port: env.smtpPort,
      auth: {
        user: env.smtpUser,
        pass: env.smtpPass,
      },
    });

    await transporter.sendMail({
      from: '"Super FC AI Admin" <admin@superfcai.tech>',
      to: userEmail,
      subject: 'Report Received - Super FC AI',
      text: `Hello,\n\nWe have received your report regarding an AI error.\n\nCited Error: ${citedError}\n\nWe are evaluating your correction to feed into the AI brain so that next time this error will be corrected.\n\nThank you for helping improve Super FC AI!\n\nBest,\nSuper FC AI Admin Team`,
    });
  }
}
