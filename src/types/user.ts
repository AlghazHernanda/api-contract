export interface User {
  id: number;
  username: string;
  email: string;
  password: string;
  created_at: Date;
  updated_at: Date;
  phone: string;
}

export interface CreateUserRequest {
  username: string;
  email: string;
  password: string;
  phone: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: Omit<User, 'password'>;
  token: string;
}