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

    // Create reviews table (satu tabel untuk movie dan tv, dibedakan media_type)
    // media_id sengaja tanpa foreign key karena serial TV tidak punya baris di movies
    await sql`
      CREATE TABLE IF NOT EXISTS reviews (
        id SERIAL PRIMARY KEY,
        user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        media_type VARCHAR(10) NOT NULL,
        media_id INT NOT NULL,
        rating SMALLINT NOT NULL,
        comment VARCHAR(1000),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        CONSTRAINT reviews_media_type_check CHECK (media_type IN ('movie', 'tv')),
        CONSTRAINT reviews_media_id_check CHECK (media_id > 0),
        CONSTRAINT reviews_rating_check CHECK (rating BETWEEN 1 AND 10),
        CONSTRAINT reviews_user_media_key UNIQUE (user_id, media_type, media_id)
      )
    `;

    // Index pendukung query daftar dan agregat per item media
    await sql`
      CREATE INDEX IF NOT EXISTS idx_reviews_media ON reviews (media_type, media_id)
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

    // Trigger untuk reviews table (buat hanya jika belum ada)
    await sql`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_trigger WHERE tgname = 'update_reviews_updated_at'
        ) THEN
          CREATE TRIGGER update_reviews_updated_at
            BEFORE UPDATE ON reviews
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
        END IF;
      END
      $$
    `;

    console.log('Users, Movies, and Reviews tables created successfully');
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization failed:', error);
    throw error;
  }
}
