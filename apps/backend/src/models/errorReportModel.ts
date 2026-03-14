import { DB } from '../db/database.ts';

export class ErrorReportModel {
  constructor(private readonly db: DB) {}

  getAll() {
    return this.db.query('SELECT * FROM error_reports ORDER BY created_at DESC');
  }

  async countTodayByUser(email: string): Promise<number> {
    const rows = await this.db.query<any>("SELECT COUNT(*) as count FROM error_reports WHERE user_email = ? AND date(created_at) = date('now')", [email]);
    return rows[0]?.count || 0;
  }

  create(user_email: string, cited_error: string, actual_correction: string) {
    return this.db.run('INSERT INTO error_reports (user_email, cited_error, actual_correction) VALUES (?, ?, ?)', [user_email, cited_error, actual_correction]);
  }

  updateStatus(id: string, status: string) {
    return this.db.run('UPDATE error_reports SET status = ? WHERE id = ?', [status, id]);
  }

  deleteById(id: string) {
    return this.db.run('DELETE FROM error_reports WHERE id = ?', [id]);
  }
}
