import { ReportModel } from '../models/reportModel.ts';

export class ReportService {
  constructor(private readonly reports: ReportModel) {}

  listByEmail(email: string) {
    return this.reports.getByEmail(email);
  }

  save(email: string, report: any) {
    return this.reports.save(email, report);
  }

  async getWeeklyUsage(email: string) {
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return this.reports.countByEmailSince(email, oneWeekAgo);
  }
}
