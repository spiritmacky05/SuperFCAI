import Database from 'better-sqlite3';
import { hashPassword } from '../utils/password.ts';

export interface DB {
  query<T = any>(sql: string, params?: any[]): Promise<T[]>;
  run(sql: string, params?: any[]): Promise<any>;
  init(): Promise<void>;
}

export class SQLiteDB implements DB {
  private db: any;

  constructor(private readonly dbPath = 'database.sqlite') {
    this.db = new Database(this.dbPath);
  }

  async init() {
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('synchronous = NORMAL');
    this.db.pragma('foreign_keys = ON');

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        email TEXT PRIMARY KEY,
        name TEXT NOT NULL DEFAULT '',
        role TEXT NOT NULL DEFAULT 'free' CHECK (role IN ('free', 'pro', 'admin', 'super_admin')),
        password TEXT NOT NULL,
        bfp_id_url TEXT,
        status TEXT NOT NULL DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'rejected')),
        bfp_account_number TEXT UNIQUE,
        proofOfPaymentUrl TEXT,
        paymentStatus TEXT CHECK (paymentStatus IN ('none', 'pending', 'approved', 'rejected')) NOT NULL DEFAULT 'none',
        subscription_expiry DATETIME,
        last_payment_date DATETIME,
        usage_reset_date DATETIME,
        session_id TEXT
      );
      CREATE TABLE IF NOT EXISTS reports (
        id TEXT PRIMARY KEY,
        email TEXT,
        timestamp INTEGER,
        params TEXT,
        result TEXT
      );
      CREATE TABLE IF NOT EXISTS knowledge (
        id TEXT PRIMARY KEY,
        timestamp INTEGER,
        title TEXT,
        content TEXT,
        category TEXT
      );
      CREATE TABLE IF NOT EXISTS error_reports (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_email TEXT,
        cited_error TEXT,
        actual_correction TEXT,
        status TEXT DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version INTEGER PRIMARY KEY,
        applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS payments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_email TEXT,
        amount REAL,
        status TEXT CHECK (status IN ('pending', 'approved', 'rejected')) NOT NULL DEFAULT 'pending',
        reference_number TEXT,
        proof_url TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_email) REFERENCES users(email) ON DELETE CASCADE
      );
    `);

    // Migration V1 - Ensure modern schema structure and constraints
    const migrationV1Applied = this.db.prepare('SELECT 1 FROM schema_migrations WHERE version = 1').get();
    if (!migrationV1Applied) {
      const migrateToV1 = this.db.transaction(() => {
        this.db.pragma('foreign_keys = OFF');

        this.db.exec(`
          ALTER TABLE users RENAME TO users_legacy;
          CREATE TABLE users (
            email TEXT PRIMARY KEY,
            name TEXT NOT NULL DEFAULT '',
            role TEXT NOT NULL DEFAULT 'free' CHECK (role IN ('free', 'pro', 'admin', 'super_admin')),
            password TEXT NOT NULL,
            bfp_id_url TEXT,
            status TEXT NOT NULL DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'rejected')),
            bfp_account_number TEXT UNIQUE,
            proofOfPaymentUrl TEXT,
            paymentStatus TEXT CHECK (paymentStatus IN ('none', 'pending', 'approved', 'rejected')) NOT NULL DEFAULT 'none',
            subscription_expiry DATETIME,
            last_payment_date DATETIME,
            usage_reset_date DATETIME,
            session_id TEXT
          );
          INSERT INTO users (
            email, name, role, password, bfp_id_url, status, bfp_account_number, 
            proofOfPaymentUrl, paymentStatus, subscription_expiry, last_payment_date, usage_reset_date, session_id
          )
          SELECT
            email,
            COALESCE(name, ''),
            CASE WHEN role IN ('free', 'pro', 'admin', 'super_admin') THEN role ELSE 'free' END,
            COALESCE(password, ''),
            bfp_id_url,
            CASE WHEN status IN ('pending', 'approved', 'rejected') THEN status ELSE 'approved' END,
            bfp_account_number,
            proofOfPaymentUrl,
            COALESCE(paymentStatus, 'none'),
            subscription_expiry,
            last_payment_date,
            usage_reset_date,
            NULL
          FROM users_legacy;
          DROP TABLE users_legacy;

          ALTER TABLE reports RENAME TO reports_legacy;
          CREATE TABLE reports (
            id TEXT PRIMARY KEY,
            email TEXT NOT NULL,
            timestamp INTEGER NOT NULL,
            params TEXT NOT NULL,
            result TEXT NOT NULL,
            FOREIGN KEY (email) REFERENCES users(email) ON DELETE CASCADE
          );
          INSERT INTO reports (id, email, timestamp, params, result)
          SELECT r.id, r.email, COALESCE(r.timestamp, 0), COALESCE(r.params, '{}'), COALESCE(r.result, '')
          FROM reports_legacy r
          JOIN users u ON u.email = r.email;
          DROP TABLE reports_legacy;

          ALTER TABLE knowledge RENAME TO knowledge_legacy;
          CREATE TABLE knowledge (
            id TEXT PRIMARY KEY,
            timestamp INTEGER NOT NULL,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            category TEXT NOT NULL CHECK (category IN ('provision', 'interpretation', 'correction'))
          );
          INSERT INTO knowledge (id, timestamp, title, content, category)
          SELECT
            id,
            COALESCE(timestamp, 0),
            COALESCE(title, ''),
            COALESCE(content, ''),
            CASE WHEN category IN ('provision', 'interpretation', 'correction') THEN category ELSE 'correction' END
          FROM knowledge_legacy;
          DROP TABLE knowledge_legacy;

          ALTER TABLE error_reports RENAME TO error_reports_legacy;
          CREATE TABLE error_reports (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_email TEXT,
            cited_error TEXT NOT NULL,
            actual_correction TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'evaluated')),
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_email) REFERENCES users(email) ON DELETE SET NULL
          );
          INSERT INTO error_reports (id, user_email, cited_error, actual_correction, status, created_at)
          SELECT
            id,
            CASE WHEN user_email IN (SELECT email FROM users) THEN user_email ELSE NULL END,
            COALESCE(cited_error, ''),
            COALESCE(actual_correction, ''),
            CASE WHEN status IN ('pending', 'evaluated') THEN status ELSE 'pending' END,
            COALESCE(created_at, CURRENT_TIMESTAMP)
          FROM error_reports_legacy;
          DROP TABLE error_reports_legacy;

          INSERT INTO schema_migrations (version) VALUES (1);
        `);

        this.db.pragma('foreign_keys = ON');
      });

      migrateToV1();
    }

    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
      CREATE INDEX IF NOT EXISTS idx_reports_email_timestamp ON reports(email, timestamp DESC);
      CREATE INDEX IF NOT EXISTS idx_knowledge_timestamp ON knowledge(timestamp DESC);
      CREATE INDEX IF NOT EXISTS idx_error_reports_user_created ON error_reports(user_email, created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_error_reports_status_created ON error_reports(status, created_at DESC);
    `);

    const seedPassword = process.env.SUPERADMIN_PASSWORD || 'admin';
    const seedPasswordHash = await hashPassword(seedPassword);
    const seedSuperAdminEmail = process.env.SUPERADMIN_EMAIL || 'spiritmacky05@gmail.com';

    this.db
      .prepare(`
        INSERT INTO users (email, name, role, password, status)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(email) DO UPDATE SET
          name = excluded.name,
          role = excluded.role,
          password = excluded.password,
          status = excluded.status
      `)
      .run('admin@bfp.gov.ph', 'Super Admin', 'admin', seedPasswordHash, 'approved');
    console.log('Ensured admin@bfp.gov.ph seed account');

    this.db
      .prepare(`
        INSERT INTO users (email, name, role, password, status)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(email) DO UPDATE SET
          name = excluded.name,
          role = excluded.role,
          password = excluded.password,
          status = excluded.status
      `)
      .run(seedSuperAdminEmail, 'Spirit Macky', 'super_admin', seedPasswordHash, 'approved');
    console.log(`Ensured ${seedSuperAdminEmail} super_admin seed account`);

    console.log('SQLite initialized');
  }

  async query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    return this.db.prepare(sql).all(...params);
  }

  async run(sql: string, params: any[] = []) {
    return this.db.prepare(sql).run(...params);
  }
}
