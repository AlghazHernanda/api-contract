import sql from '../utils/database';
import { User, CreateUserRequest } from '../types/user';
import { hashPassword } from '../utils/password';

export class UserModel {
  //Omit utility untuk exclude password field
  static async create(userData: CreateUserRequest): Promise<Omit<User, 'password'>> {

    //Extract semua field dari CreateUserRequest object
    //TypeScript destructuring untuk assign ke variable
    const { username, email, password, phone } = userData;

    // Hash the password
    const hashedPassword = await hashPassword(password);

    try {
      // INSERT dengan RETURNING — PostgreSQL bisa langsung return data yang baru dibuat
      const [user] = await sql`
        INSERT INTO users (username, email, password, phone)
        VALUES (${username}, ${email}, ${hashedPassword}, ${phone})
        RETURNING id, username, email, phone, created_at, updated_at
      `;

      return user as Omit<User, 'password'>;
    } catch (error: any) {
      // PostgreSQL unique violation error code = 23505
      if (error.code === '23505') {
        if (error.constraint_name?.includes('username') || error.detail?.includes('username')) {
          throw new Error('Username already exists');
        } else if (error.constraint_name?.includes('email') || error.detail?.includes('email')) {
          throw new Error('Email already exists');
        }
        throw new Error('Username or Email already exists');
      }
      throw error;
    }
  }

  //query untuk mencari user berdasarkan email
  static async findByEmail(email: string): Promise<User | null> {
    try {
      const users = await sql`SELECT * FROM users WHERE email = ${email}`;
      return users.length > 0 ? (users[0] as unknown as User) : null;
    } catch (error) {
      throw error;
    }
  }

  //query untuk mencari userID
  static async findById(id: number): Promise<User | null> {
    try {
      const users = await sql`SELECT * FROM users WHERE id = ${id}`;
      return users.length > 0 ? (users[0] as unknown as User) : null;
    } catch (error) {
      throw error;
    }
  }

  //cari semua by username
  static async findByUsername(username: string): Promise<User | null> {
    try {
      const users = await sql`SELECT * FROM users WHERE username = ${username}`;
      return users.length > 0 ? (users[0] as unknown as User) : null;
    } catch (error) {
      throw error;
    }
  }
}
