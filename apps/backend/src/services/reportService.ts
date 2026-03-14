import { ReportModel } from '../models/reportModel.ts';

export class ReportService {
  constructor(private readonly reports: ReportModel) {}

  listByEmail(email: string) {
    return this.reports.getByEmail(email);
  }

  save(email: string, report: any) {
    return this.reports.save(email, report);
  }
}
