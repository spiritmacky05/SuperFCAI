import { DB } from '../db/database.ts';

export class UserModel {
  constructor(private readonly db: DB) {}

  getAll() {
    return this.db.query('SELECT * FROM users');
  }

  getByCredentials(email: string, password: string) {
    return this.db.query('SELECT * FROM users WHERE email = LOWER(TRIM(?)) AND password = ?', [email, password]);
  }

  getByEmail(email: string) {
    return this.db.query('SELECT * FROM users WHERE email = LOWER(TRIM(?))', [email]);
  }

  async upsert(payload: {
    email: string;
    name?: string;
    role?: string;
    password?: string;
    bfp_id_url?: string;
    status?: string;
    bfp_account_number?: string;
    proof_of_payment_url?: string;
    payment_status?: string;
    subscription_expiry?: string;
    last_payment_date?: string;
    usage_reset_date?: string;
    session_id?: string;
  }) {
    const { 
      email, name, role, password, bfp_id_url, status, 
      bfp_account_number, proof_of_payment_url, payment_status,
      subscription_expiry, last_payment_date, usage_reset_date,
      session_id
    } = payload;
    const existing = await this.getByEmail(email);
 
    if (existing.length > 0) {
      return this.db.run(
        `UPDATE users SET 
          name = COALESCE(?, name), 
          role = COALESCE(?, role), 
          password = COALESCE(?, password), 
          bfp_id_url = COALESCE(?, bfp_id_url), 
          status = COALESCE(?, status), 
          bfp_account_number = COALESCE(?, bfp_account_number), 
          proof_of_payment_url = COALESCE(?, proof_of_payment_url), 
          payment_status = COALESCE(?, payment_status),
          subscription_expiry = COALESCE(?, subscription_expiry),
          last_payment_date = COALESCE(?, last_payment_date),
          usage_reset_date = COALESCE(?, usage_reset_date),
          session_id = COALESCE(?, session_id)
        WHERE email = LOWER(TRIM(?))`,
        [
          name ?? null, role ?? null, password ?? null, bfp_id_url ?? null, status ?? null, 
          bfp_account_number ?? null, proof_of_payment_url ?? null, payment_status ?? null,
          subscription_expiry ?? null, last_payment_date ?? null, usage_reset_date ?? null,
          session_id ?? null, email
        ],
      );
    }
 
    return this.db.run(
      'INSERT INTO users (email, name, role, password, bfp_id_url, status, bfp_account_number, proof_of_payment_url, payment_status, subscription_expiry, last_payment_date, usage_reset_date, session_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        email, name, role || 'free', password, bfp_id_url || null, 
        status || 'pending', bfp_account_number || null, proof_of_payment_url || null, 
        payment_status || 'none', subscription_expiry || null, 
        last_payment_date || null, usage_reset_date || null, session_id || null
      ],
    );
  }

  getPaymentsByEmail(email: string) {
    return this.db.query('SELECT * FROM payments WHERE user_email = LOWER(TRIM(?)) ORDER BY created_at DESC', [email]);
  }

  createPayment(payment: {
    user_email: string;
    amount: number;
    status: string;
    reference_number?: string;
    proof_url?: string;
  }) {
    return this.db.run(
      'INSERT INTO payments (user_email, amount, status, reference_number, proof_url) VALUES (?, ?, ?, ?, ?)',
      [payment.user_email, payment.amount, payment.status, payment.reference_number, payment.proof_url]
    );
  }

  updateRoleStatus(email: string, role?: string, status?: string) {
    return this.db.run('UPDATE users SET role = COALESCE(?, role), status = COALESCE(?, status) WHERE email = LOWER(TRIM(?))', [role, status || 'approved', email]);
  }

  updatePaymentStatus(email: string, payment_status: string, proof_of_payment_url: string) {
    return this.db.run('UPDATE users SET payment_status = ?, proof_of_payment_url = ? WHERE email = LOWER(TRIM(?))', [payment_status, proof_of_payment_url, email]);
  }

  updatePassword(email: string, passwordHash: string) {
    return this.db.run('UPDATE users SET password = ? WHERE email = LOWER(TRIM(?))', [passwordHash, email]);
  }

  deleteByEmail(email: string) {
    return this.db.run('DELETE FROM users WHERE email = LOWER(TRIM(?))', [email]);
  }
}
