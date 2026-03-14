import { DB } from '../db/database.ts';

export class ReportModel {
  constructor(private readonly db: DB) {}

  async getByEmail(email: string) {
    const reports = await this.db.query<any>('SELECT * FROM reports WHERE email = ? ORDER BY timestamp DESC', [email]);
    return reports.map((r: any) => ({
      ...r,
      params: JSON.parse(r.params),
    }));
  }

  save(email: string, report: any) {
    const { id, timestamp, params, result } = report;
    return this.db.run('INSERT INTO reports (id, email, timestamp, params, result) VALUES (?, ?, ?, ?, ?)', [id, email, timestamp, JSON.stringify(params), result]);
  }
}
