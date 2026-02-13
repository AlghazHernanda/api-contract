import { pool } from '../utils/database';
import { User, CreateUserRequest } from '../types/user';
import { hashPassword } from '../utils/password';

export class UserModel {
  static async create(userData: CreateUserRequest): Promise<Omit<User, 'password'>> {
    const { username, email, password } = userData;
    
    // Hash the password
    const hashedPassword = await hashPassword(password);
    
    const query = `
      INSERT INTO users (username, email, password)
      VALUES (?, ?, ?)
    `;
    
    try {
      const [result] = await pool.execute(query, [username, email, hashedPassword]);
      const insertId = (result as any).insertId;
      
      // Return the created user without password
      const user = await this.findById(insertId);
      if (!user) {
        throw new Error('Failed to retrieve created user');
      }
      
      const { password: _, ...userWithoutPassword } = user;
      return userWithoutPassword;
    } catch (error: any) {
      if (error.code === 'ER_DUP_ENTRY') {
        if (error.message.includes('username')) {
          throw new Error('Username already exists');
        } else if (error.message.includes('email')) {
          throw new Error('Email already exists');
        }
      }
      throw error;
    }
  }
  
  static async findByEmail(email: string): Promise<User | null> {
    const query = 'SELECT * FROM users WHERE email = ?';
    
    try {
      const [rows] = await pool.execute(query, [email]);
      const users = rows as User[];
      return users.length > 0 ? users[0] : null;
    } catch (error) {
      throw error;
    }
  }
  
  static async findById(id: number): Promise<User | null> {
    const query = 'SELECT * FROM users WHERE id = ?';
    
    try {
      const [rows] = await pool.execute(query, [id]);
      const users = rows as User[];
      return users.length > 0 ? users[0] : null;
    } catch (error) {
      throw error;
    }
  }
  
  static async findByUsername(username: string): Promise<User | null> {
    const query = 'SELECT * FROM users WHERE username = ?';
    
    try {
      const [rows] = await pool.execute(query, [username]);
      const users = rows as User[];
      return users.length > 0 ? users[0] : null;
    } catch (error) {
      throw error;
    }
  }
}