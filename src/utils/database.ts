import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

interface DatabaseConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
}

const config: DatabaseConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'auth_api'
};

export const pool = mysql.createPool({
  host: config.host,
  port: config.port,
  user: config.user,
  password: config.password,
  database: config.database,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4',
  connectTimeout: 60000
});

export async function testConnection(): Promise<boolean> {
  try {
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    console.log('Database connection successful');
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}

export async function initializeDatabase(): Promise<void> {
  try {
    // First connect without database to create it
    const tempPool = mysql.createPool({
      host: config.host,
      port: config.port,
      user: config.user,
      password: config.password,
      waitForConnections: true,
      connectionLimit: 1,
      queueLimit: 0,
      charset: 'utf8mb4',
      connectTimeout: 60000
    });
    
    const connection = await tempPool.getConnection();
    
    // Create database if it doesn't exist
    await connection.query(`CREATE DATABASE IF NOT EXISTS ${config.database}`);
    console.log(`Database '${config.database}' created or already exists`);
    
    connection.release();
    await tempPool.end();
    
    // Now connect to the specific database and create table
    const dbConnection = await pool.getConnection();
    
    // Create users table
    await dbConnection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) NOT NULL UNIQUE,
        email VARCHAR(100) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    
    // Create movies table
    await dbConnection.query(`
      CREATE TABLE IF NOT EXISTS movies (
        id INT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        budget BIGINT DEFAULT 0,
        revenue BIGINT DEFAULT 0,
        favorite INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP NULL DEFAULT NULL,
        UNIQUE KEY unique_movie_id (id)
      )
    `);
    
    // Add deleted_at column if it doesn't exist (for existing tables)
    try {
      await dbConnection.query(`
        ALTER TABLE movies
        ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP NULL DEFAULT NULL
      `);
      console.log('deleted_at column added to movies table (or already exists)');
    } catch (error) {
      // Column might already exist, ignore error
      console.log('deleted_at column already exists in movies table');
    }
    
    // Add favorite column if it doesn't exist (for existing tables)
    try {
      await dbConnection.query(`
        ALTER TABLE movies
        ADD COLUMN IF NOT EXISTS favorite INT DEFAULT 0
      `);
      console.log('favorite column added to movies table (or already exists)');
    } catch (error) {
      // Column might already exist, ignore error
      console.log('favorite column already exists in movies table');
    }
    
    dbConnection.release();
    console.log('Users and Movies tables created successfully');
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization failed:', error);
    throw error;
  }
}