import { ErrorReportModel } from '../models/errorReportModel.ts';
import { EmailService } from './emailService.ts';

export class ErrorReportService {
  constructor(
    private readonly reports: ErrorReportModel,
    private readonly emailService: EmailService,
  ) {}

  list() {
    return this.reports.getAll();
  }

  async create(payload: { user_email: string; cited_error: string; actual_correction: string }) {
    const { user_email, cited_error, actual_correction } = payload;
    const todayCount = await this.reports.countTodayByUser(user_email);

    if (todayCount >= 3) {
      return { status: 429, payload: { error: 'You have reached the maximum limit of 3 error reports per day.' } };
    }

    await this.reports.create(user_email, cited_error, actual_correction);

    try {
      await this.emailService.sendErrorReportReceived(user_email, cited_error);
      console.log(`Email sent to ${user_email} for error report.`);
    } catch (emailErr) {
      console.error('Failed to send email notification:', emailErr);
    }

    return { status: 200, payload: { success: true } };
  }

  updateStatus(id: string, status: string) {
    return this.reports.updateStatus(id, status);
  }

  delete(id: string) {
    return this.reports.deleteById(id);
  }
}
