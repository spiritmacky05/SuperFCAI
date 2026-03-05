
import pg from 'pg';
import dotenv from 'dotenv';
import Database from 'better-sqlite3';

dotenv.config();

async function testConnection() {
  console.log('\n--- Database Connection Test ---\n');
  
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.warn('⚠️  DATABASE_URL is not set in .env file.');
    console.log('Checking SQLite fallback...');
    try {
      const db = new Database('database.sqlite');
      db.exec('CREATE TABLE IF NOT EXISTS test_connection (id INTEGER PRIMARY KEY)');
      console.log('✅ SQLite database is working (local fallback).');
      console.log('   File: database.sqlite');
    } catch (err) {
      console.error('❌ SQLite check failed:', err);
    }
    console.log('\nTo test PostgreSQL, set DATABASE_URL in .env file.');
    return;
  }

  console.log(`Testing PostgreSQL connection...`);
  try {
    const url = new URL(databaseUrl);
    console.log(`Host: ${url.hostname}`);
    console.log(`Port: ${url.port}`);
    console.log(`User: ${url.username}`);
    console.log(`Database: ${url.pathname.slice(1)}`);
  } catch (e) {
    console.log('Could not parse connection string URL for display.');
  }
  
  const useSSL = process.env.DATABASE_SSL === 'true' || databaseUrl.includes('sslmode=require');
  console.log(`SSL Enabled: ${useSSL}`);

  const pool = new pg.Pool({
    connectionString: databaseUrl,
    ssl: useSSL ? { rejectUnauthorized: false } : false,
    connectionTimeoutMillis: 5000,
  });

  try {
    const client = await pool.connect();
    console.log('✅ Successfully connected to PostgreSQL!');
    const res = await client.query('SELECT NOW() as now');
    console.log('Current DB Time:', res.rows[0].now);
    client.release();
  } catch (err: any) {
    console.error('❌ PostgreSQL connection failed:', err.message);
    if (err.code === '28P01') {
      console.error('Hint: Check your username and password.');
    } else if (err.code === '3D000') {
      console.error('Hint: Check if the database name exists.');
    } else if (err.code === 'ENOTFOUND') {
      console.error('Hint: Check the hostname.');
    }
  } finally {
    await pool.end();
  }
}

testConnection();
