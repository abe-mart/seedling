import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from project root (one directory up from backend/)
dotenv.config({ path: path.join(__dirname, '..', '.env') });

import pkg from 'pg';
const { Pool } = pkg;

// Database connection pool
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Fallback to individual env vars if DATABASE_URL not available
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'seedling',
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || '5432'),
});

// Test connection
pool.on('connect', () => {
  console.log('✅ Database connected successfully');
});

pool.on('error', (err) => {
  console.error('❌ Unexpected database error:', err);
  process.exit(-1);
});

export default pool;
