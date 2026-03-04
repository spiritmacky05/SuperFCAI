import pg from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

async function seedDatabase() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error('Error: DATABASE_URL environment variable is not set.');
    console.error('Please set it in your .env file or environment.');
    process.exit(1);
  }

  console.log('Connecting to database...');
  const pool = new pg.Pool({
    connectionString: databaseUrl,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    const client = await pool.connect();
    console.log('Connected successfully.');

    const seedFilePath = path.join(__dirname, 'supabase_seed.sql');
    console.log(`Reading seed file from: ${seedFilePath}`);
    
    if (!fs.existsSync(seedFilePath)) {
        console.error('Error: supabase_seed.sql file not found.');
        process.exit(1);
    }

    const sql = fs.readFileSync(seedFilePath, 'utf8');

    console.log('Executing SQL script...');
    await client.query(sql);
    
    console.log('Database seeded successfully!');
    client.release();
  } catch (err) {
    console.error('Error seeding database:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

seedDatabase();
