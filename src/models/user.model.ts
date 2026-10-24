import { query } from '../db/index.js';

export interface User {
  id: string;
  phone: string;
  username: string;
  display_name: string;
  created_at: Date;
  updated_at: Date;
}

export interface CreateUserInput {
  phone: string;
  username: string;
  display_name: string;
}

export class UserModel {
  async findById(id: string): Promise<User | null> {
    const res = await query<User>(
      `SELECT id, phone, username, display_name, created_at, updated_at 
       FROM users 
       WHERE id = $1`,
      [id]
    );
    return res.rows[0] || null;
  }

  async findByPhone(phone: string): Promise<User | null> {
    const res = await query<User>(
      `SELECT id, phone, username, display_name, created_at, updated_at 
       FROM users 
       WHERE phone = $1`,
      [phone]
    );
    return res.rows[0] || null;
  }

  async findByUsername(username: string): Promise<User | null> {
    const res = await query<User>(
      `SELECT id, phone, username, display_name, created_at, updated_at 
       FROM users 
       WHERE username = $1`,
      [username]
    );
    return res.rows[0] || null;
  }

  async create(data: CreateUserInput): Promise<User> {
    const res = await query<User>(
      `INSERT INTO users (phone, username, display_name) 
       VALUES ($1, $2, $3) 
       RETURNING id, phone, username, display_name, created_at, updated_at`,
      [data.phone, data.username, data.display_name]
    );
    return res.rows[0];
  }
}

export const userModel = new UserModel();
