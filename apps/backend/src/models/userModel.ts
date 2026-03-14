import { DB } from '../db/database.ts';

export class UserModel {
  constructor(private readonly db: DB) {}

  getAll() {
    return this.db.query('SELECT * FROM users');
  }

  getByCredentials(email: string, password: string) {
    return this.db.query('SELECT * FROM users WHERE email = ? AND password = ?', [email, password]);
  }

  getByEmail(email: string) {
    return this.db.query('SELECT * FROM users WHERE email = ?', [email]);
  }

  async upsert(payload: {
    email: string;
    name?: string;
    role?: string;
    password?: string;
    bfp_id_url?: string;
    status?: string;
    bfp_account_number?: string;
  }) {
    const { email, name, role, password, bfp_id_url, status, bfp_account_number } = payload;
    const existing = await this.getByEmail(email);

    if (existing.length > 0) {
      return this.db.run(
        'UPDATE users SET name = COALESCE(?, name), role = COALESCE(?, role), password = COALESCE(?, password), bfp_id_url = COALESCE(?, bfp_id_url), status = COALESCE(?, status), bfp_account_number = COALESCE(?, bfp_account_number) WHERE email = ?',
        [name, role, password, bfp_id_url, status, bfp_account_number, email],
      );
    }

    return this.db.run(
      'INSERT INTO users (email, name, role, password, bfp_id_url, status, bfp_account_number) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [email, name, role || 'free', password, bfp_id_url || null, status || 'pending', bfp_account_number || null],
    );
  }

  updateRoleStatus(email: string, role?: string, status?: string) {
    return this.db.run('UPDATE users SET role = COALESCE(?, role), status = COALESCE(?, status) WHERE email = ?', [role, status || 'approved', email]);
  }

  updatePassword(email: string, passwordHash: string) {
    return this.db.run('UPDATE users SET password = ? WHERE email = ?', [passwordHash, email]);
  }

  deleteByEmail(email: string) {
    return this.db.run('DELETE FROM users WHERE email = ?', [email]);
  }
}
