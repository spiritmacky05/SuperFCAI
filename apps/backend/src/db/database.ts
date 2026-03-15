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
        proof_of_payment_url TEXT,
        payment_status TEXT CHECK (payment_status IN ('none', 'pending', 'approved', 'rejected')) NOT NULL DEFAULT 'none',
        subscription_expiry DATETIME,
        last_payment_date DATETIME,
        usage_reset_date DATETIME,
        session_id TEXT
      );
      CREATE TABLE IF NOT EXISTS reports (
        id TEXT PRIMARY KEY,
        email TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        params TEXT NOT NULL,
        result TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS knowledge (
        id TEXT PRIMARY KEY,
        timestamp INTEGER NOT NULL,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        category TEXT NOT NULL CHECK (category IN ('provision', 'interpretation', 'correction'))
      );
      CREATE TABLE IF NOT EXISTS error_reports (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_email TEXT,
        cited_error TEXT NOT NULL,
        actual_correction TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'evaluated')),
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_email) REFERENCES users(email) ON DELETE SET NULL
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

    // Migration V1 - Handle legacy tables if they exist
    const migrationV1Applied = this.db.prepare('SELECT 1 FROM schema_migrations WHERE version = 1').get();
    if (!migrationV1Applied) {
      console.log('[MIGRATION] Checking for V1 legacy tables...');
      const hasLegacyUsers = this.db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='users_legacy'").get();
      
      // If users exists but has old columns, we might need to migrate.
      // However, for most fresh installs, CREATE TABLE already made the right one.
      const columns = this.db.prepare("PRAGMA table_info(users)").all();
      const hasOldColumn = columns.some((c: any) => c.name === 'proofOfPaymentUrl');

      if (hasOldColumn) {
        console.log('[MIGRATION] Running V1 Migration (Normalizing Schema)...');
        const migrateToV1 = this.db.transaction(() => {
          this.db.pragma('foreign_keys = OFF');
          this.db.exec('ALTER TABLE users RENAME TO users_legacy');
          this.db.exec(`
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
            )
          `);
          this.db.exec(`
            INSERT INTO users (email, name, role, password, bfp_id_url, status, bfp_account_number, proofOfPaymentUrl, paymentStatus, subscription_expiry, last_payment_date, usage_reset_date, session_id)
            SELECT email, COALESCE(name, ''), role, password, bfp_id_url, status, bfp_account_number, proofOfPaymentUrl, paymentStatus, subscription_expiry, last_payment_date, usage_reset_date, session_id FROM users_legacy
          `);
          this.db.exec('DROP TABLE users_legacy');
          this.db.pragma('foreign_keys = ON');
        });
        migrateToV1();
      }
      this.db.prepare('INSERT OR IGNORE INTO schema_migrations (version) VALUES (1)').run();
    }

    // Migration V2 - Standardize snake_case columns
    const migrationV2Applied = this.db.prepare('SELECT 1 FROM schema_migrations WHERE version = 2').get();
    if (!migrationV2Applied) {
      const columns = this.db.prepare("PRAGMA table_info(users)").all();
      const needsV2 = columns.some((c: any) => c.name === 'proofOfPaymentUrl');

      if (needsV2) {
        console.log('[MIGRATION] Running V2 Migration (Snake Case Standardization)...');
        const migrateToV2 = this.db.transaction(() => {
          this.db.pragma('foreign_keys = OFF');
          
          // Split into sequential steps for schema visibility
          this.db.exec('ALTER TABLE users RENAME TO users_v1');
          
          this.db.exec(`
            CREATE TABLE users (
              email TEXT PRIMARY KEY,
              name TEXT NOT NULL DEFAULT '',
              role TEXT NOT NULL DEFAULT 'free' CHECK (role IN ('free', 'pro', 'admin', 'super_admin')),
              password TEXT NOT NULL,
              bfp_id_url TEXT,
              status TEXT NOT NULL DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'rejected')),
              bfp_account_number TEXT UNIQUE,
              proof_of_payment_url TEXT,
              payment_status TEXT CHECK (payment_status IN ('none', 'pending', 'approved', 'rejected')) NOT NULL DEFAULT 'none',
              subscription_expiry DATETIME,
              last_payment_date DATETIME,
              usage_reset_date DATETIME,
              session_id TEXT
            )
          `);

          this.db.exec(`
            INSERT INTO users (
              email, name, role, password, bfp_id_url, status, bfp_account_number, 
              proof_of_payment_url, payment_status, subscription_expiry, last_payment_date, usage_reset_date, session_id
            )
            SELECT
              email, name, role, password, bfp_id_url, status, bfp_account_number, 
              proofOfPaymentUrl, paymentStatus, subscription_expiry, last_payment_date, usage_reset_date, session_id
            FROM users_v1
          `);
          
          this.db.exec('DROP TABLE users_v1');
          this.db.pragma('foreign_keys = ON');
        });
        migrateToV2();
      }
      this.db.prepare('INSERT OR IGNORE INTO schema_migrations (version) VALUES (2)').run();
    }

    // Migration V3 - Normalizing all emails to lowercase in the database
    const migrationV3Applied = this.db.prepare('SELECT 1 FROM schema_migrations WHERE version = 3').get();
    if (!migrationV3Applied) {
      console.log('[MIGRATION] Running V3 Migration (Email Normalization)...');
      const migrateToV3 = this.db.transaction(() => {
        this.db.pragma('foreign_keys = OFF');
        this.db.exec(`UPDATE users SET email = LOWER(TRIM(email))`);
        this.db.exec(`UPDATE reports SET email = LOWER(TRIM(email))`);
        this.db.exec(`UPDATE error_reports SET user_email = LOWER(TRIM(user_email))`);
        this.db.exec(`UPDATE payments SET user_email = LOWER(TRIM(user_email))`);
        this.db.pragma('foreign_keys = ON');
      });
      migrateToV3();
      this.db.prepare('INSERT OR IGNORE INTO schema_migrations (version) VALUES (3)').run();
      console.log('[MIGRATION] Migration V3: Lowercased all database emails.');
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
        INSERT OR IGNORE INTO users (email, name, role, password, status)
        VALUES (?, ?, ?, ?, ?)
      `)
      .run('admin@bfp.gov.ph', 'Super Admin', 'admin', seedPasswordHash, 'approved');
    console.log('Ensured admin@bfp.gov.ph seed account');

    this.db
      .prepare(`
        INSERT OR IGNORE INTO users (email, name, role, password, status)
        VALUES (?, ?, ?, ?, ?)
      `)
      .run(seedSuperAdminEmail, 'Spirit Macky', 'super_admin', seedPasswordHash, 'approved');
    console.log(`[SEED] Ensured super_admin: ${seedSuperAdminEmail} (Default Password: "${seedPassword}")`);

    console.log('SQLite initialized');
  }

  async query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    return this.db.prepare(sql).all(...params);
  }

  async run(sql: string, params: any[] = []) {
    return this.db.prepare(sql).run(...params);
  }
}
