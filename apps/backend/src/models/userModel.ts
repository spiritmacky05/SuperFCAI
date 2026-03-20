import { DB } from '../db/database.ts';

export class UserModel {
  constructor(private readonly db: DB) {}

  getAll() {
    return this.db.query('SELECT * FROM users');
  }

  async getPaginatedUsers(page: number, limit: number, search: string, roleFilter: string, statusFilter: string) {
    const offset = (page - 1) * limit;
    let query = 'SELECT email, name, role, bfp_id_url, status, bfp_account_number, proof_of_payment_url as proofOfPaymentUrl, payment_status as paymentStatus, subscription_expiry, last_payment_date FROM users WHERE 1=1';
    const params: any[] = [];

    if (search) {
      query += ' AND (name LIKE ? OR email LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }
    if (roleFilter && roleFilter !== 'all') {
      query += ' AND role = ?';
      params.push(roleFilter);
    }
    if (statusFilter && statusFilter !== 'all') {
      query += ' AND status = ?';
      params.push(statusFilter);
    }

    const countQuery = query.replace('SELECT email, name, role, bfp_id_url, status, bfp_account_number, proof_of_payment_url as proofOfPaymentUrl, payment_status as paymentStatus, subscription_expiry, last_payment_date', 'SELECT COUNT(*) as total');
    const countResult = await this.db.query(countQuery, params);
    const total = countResult[0].total;

    query += ' ORDER BY email ASC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const data = await this.db.query(query, params);
    return { data, total };
  }

  async getUserStats() {
    const result = await this.db.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN role = 'free' THEN 1 ELSE 0 END) as freeCount,
        SUM(CASE WHEN role = 'pro' THEN 1 ELSE 0 END) as proCount
      FROM users
    `);
    return result[0];
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
    reset_password_token?: string;
    reset_password_token_expiry?: string;
  }) {
    const { 
      email, name, role, password, bfp_id_url, status, 
      bfp_account_number, proof_of_payment_url, payment_status,
      subscription_expiry, last_payment_date, usage_reset_date,
      session_id, reset_password_token, reset_password_token_expiry
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
          session_id = COALESCE(?, session_id),
          reset_password_token = COALESCE(?, reset_password_token),
          reset_password_token_expiry = COALESCE(?, reset_password_token_expiry)
        WHERE email = LOWER(TRIM(?))`,
        [
          name ?? null, role ?? null, password ?? null, bfp_id_url ?? null, status ?? null, 
          bfp_account_number ?? null, proof_of_payment_url ?? null, payment_status ?? null,
          subscription_expiry ?? null, last_payment_date ?? null, usage_reset_date ?? null,
          session_id ?? null, reset_password_token ?? null, reset_password_token_expiry ?? null, email
        ],
      );
    }
 
    return this.db.run(
      'INSERT INTO users (email, name, role, password, bfp_id_url, status, bfp_account_number, proof_of_payment_url, payment_status, subscription_expiry, last_payment_date, usage_reset_date, session_id, reset_password_token, reset_password_token_expiry) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        email, name, role || 'free', password, bfp_id_url || null, 
        status || 'pending', bfp_account_number || null, proof_of_payment_url || null, 
        payment_status || 'none', subscription_expiry || null, 
        last_payment_date || null, usage_reset_date || null, session_id || null,
        reset_password_token || null, reset_password_token_expiry || null
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
  
  updateResetToken(email: string, token: string | null, expiry: string | null) {
    return this.db.run('UPDATE users SET reset_password_token = ?, reset_password_token_expiry = ? WHERE email = LOWER(TRIM(?))', [token, expiry, email]);
  }

  getByResetToken(token: string) {
    return this.db.query('SELECT * FROM users WHERE reset_password_token = ?', [token]);
  }
}
