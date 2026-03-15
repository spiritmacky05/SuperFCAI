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

  async countByEmailSince(email: string, since: number) {
    const result = await this.db.query<{ count: number }>('SELECT COUNT(*) as count FROM reports WHERE email = ? AND timestamp >= ?', [email, since]);
    return result[0]?.count || 0;
  }
}
