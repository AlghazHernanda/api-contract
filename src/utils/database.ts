import postgres from 'postgres';
import dotenv from 'dotenv';

dotenv.config();

// Connection string dari Supabase Dashboard > Connect
const connectionString = process.env.DATABASE_URL || '';

// Buat koneksi postgres.js
// postgres.js otomatis handle connection pooling
const sql = postgres(connectionString, {
  max: 10, // max connections in pool
  idle_timeout: 20, // close idle connections after 20 seconds
  connect_timeout: 60, // timeout koneksi 60 detik
});

export default sql;

export async function testConnection(): Promise<boolean> {
  try {
    await sql`SELECT 1 as connected`;
    console.log('Database connection successful');
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}

export async function initializeDatabase(): Promise<void> {
  try {
    // Create users table (PostgreSQL syntax)
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) NOT NULL UNIQUE,
        email VARCHAR(100) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        phone VARCHAR(20),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;

    // Create movies table (PostgreSQL syntax)
    await sql`
      CREATE TABLE IF NOT EXISTS movies (
        id INT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        budget BIGINT DEFAULT 0,
        revenue BIGINT DEFAULT 0,
        favorite INT DEFAULT 0,
        aggregator_response JSONB,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        deleted_at TIMESTAMP NULL DEFAULT NULL
      )
    `;

    // Buat function untuk auto-update updated_at (pengganti ON UPDATE CURRENT_TIMESTAMP di MySQL)
    await sql`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ language 'plpgsql'
    `;

    // Trigger untuk users table (buat hanya jika belum ada)
    await sql`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_trigger WHERE tgname = 'update_users_updated_at'
        ) THEN
          CREATE TRIGGER update_users_updated_at
            BEFORE UPDATE ON users
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
        END IF;
      END
      $$
    `;

    // Trigger untuk movies table (buat hanya jika belum ada)
    await sql`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_trigger WHERE tgname = 'update_movies_updated_at'
        ) THEN
          CREATE TRIGGER update_movies_updated_at
            BEFORE UPDATE ON movies
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
        END IF;
      END
      $$
    `;

    console.log('Users and Movies tables created successfully');
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization failed:', error);
    throw error;
  }
}
