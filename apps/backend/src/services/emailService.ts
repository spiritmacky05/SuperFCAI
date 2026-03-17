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

  async sendPasswordReset(userEmail: string, token: string) {
    if (!env.smtpUser || !env.smtpPass) {
      console.log(`Password reset email skipped for ${userEmail}: SMTP credentials not configured.`);
      console.log(`Token for ${userEmail}: ${token}`);
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

    const resetUrl = `${env.frontendUrl || 'http://localhost:5173'}/reset-password?token=${token}`;

    await transporter.sendMail({
      from: '"Super FC AI Admin" <admin@superfcai.tech>',
      to: userEmail,
      subject: 'Password Reset - Super FC AI',
      text: `Hello,\n\nYou requested a password reset for your Super FC AI account.\n\nPlease click the link below to reset your password:\n\n${resetUrl}\n\nThis link will expire in 1 hour.\n\nIf you did not request this, please ignore this email.\n\nBest,\nSuper FC AI Admin Team`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #1e3a8a;">Password Reset</h2>
          <p>Hello,</p>
          <p>You requested a password reset for your Super FC AI account.</p>
          <p>Please click the button below to reset your password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #1e3a8a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Reset Password</a>
          </div>
          <p>Alternatively, you can copy and paste this link into your browser:</p>
          <p>${resetUrl}</p>
          <p>This link will expire in 1 hour.</p>
          <p>If you did not request this, please ignore this email.</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="font-size: 12px; color: #666;">Super FC AI Admin Team</p>
        </div>
      `
    });
  }
}
