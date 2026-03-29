import jwt from 'jsonwebtoken';
import { User } from '../types/user';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

export interface JwtPayload {
  userId: number;
  email: string;
  username: string;
}

//create jwt token
//Omit memastikan password tidak masuk token (security), jadinya Menerima object user tanpa field password
export function generateToken(user: Omit<User, 'password'>): string {
  const payload: JwtPayload = {
    userId: user.id,
    email: user.email,
    username: user.username
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN
  } as jwt.SignOptions);
}

export function verifyToken(token: string): JwtPayload {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch (error) {
    throw new Error('Invalid token');
  }
}

export function extractTokenFromHeader(authHeader: string | undefined): string | null {
  if (!authHeader) {
    return null;
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }

  return parts[1];
}