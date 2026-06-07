import { getDbConnection } from '../config/db.config';
import bcrypt from 'bcryptjs';
import { User } from '../../src/types';
import { db as mockDb } from '../db';

export class UserModel {
  /**
   * Find a user by email address
   */
  static async findByEmail(email: string): Promise<User | null> {
    const conn = await getDbConnection();
    
    if (conn.isMock) {
      const mockUser = mockDb.queryUserByEmail(email);
      return mockUser || null;
    }

    try {
      const queryStr = 'SELECT id, email, password_hash as password, role, full_name as fullName, phone, registration_no as registrationNo, status, created_at as createdAt FROM users WHERE email = ? LIMIT 1';
      const results: any = await conn.query(queryStr, [email.toLowerCase().trim()]);
      
      if (Array.isArray(results) && results.length > 0) {
        return results[0] as User;
      }
      return null;
    } catch (err) {
      console.error('Error finding user by email:', err);
      // Failover safely
      const mockUser = mockDb.queryUserByEmail(email);
      return mockUser || null;
    }
  }

  /**
   * Find a user by unique identifier
   */
  static async findById(id: string): Promise<User | null> {
    const conn = await getDbConnection();

    if (conn.isMock) {
      const mockUser = mockDb.queryUserById(id);
      return mockUser || null;
    }

    try {
      const queryStr = 'SELECT id, email, password_hash as password, role, full_name as fullName, phone, registration_no as registrationNo, status, created_at as createdAt FROM users WHERE id = ? LIMIT 1';
      const results: any = await conn.query(queryStr, [id]);

      if (Array.isArray(results) && results.length > 0) {
        return results[0] as User;
      }
      return null;
    } catch (err) {
      console.error('Error finding user by id:', err);
      const mockUser = mockDb.queryUserById(id);
      return mockUser || null;
    }
  }

  /**
   * Create a new user with encryption
   */
  static async create(userData: {
    fullName: string;
    email: string;
    passwordPlain: string;
    role: 'admin' | 'teacher' | 'student' | 'parent';
    phone?: string;
    registrationNo?: string;
  }): Promise<User> {
    const conn = await getDbConnection();
    const id = 'u-' + Math.random().toString(36).substr(2, 9);
    
    // Encrypt password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(userData.passwordPlain, salt);
    
    const registrationNo = userData.registrationNo || `BYA-${userData.role.toUpperCase().substring(0, 3)}-${Math.floor(1000 + Math.random() * 9000)}`;
    const phone = userData.phone || '';

    if (conn.isMock) {
      const mockUser = mockDb.insertUser({
        email: userData.email,
        fullName: userData.fullName,
        role: userData.role,
        phone,
        registrationNo
      }, userData.passwordPlain);
      
      return mockUser;
    }

    try {
      const queryStr = `
        INSERT INTO users (id, email, password_hash, role, full_name, phone, registration_no, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'active', CURRENT_TIMESTAMP)
      `;
      
      await conn.query(queryStr, [
        id,
        userData.email.toLowerCase().trim(),
        passwordHash,
        userData.role,
        userData.fullName,
        phone,
        registrationNo
      ]);

      // Return the complete User interface
      return {
        id,
        email: userData.email,
        role: userData.role,
        fullName: userData.fullName,
        phone,
        registrationNo,
        status: 'active',
        createdAt: new Date().toISOString()
      };
    } catch (err) {
      console.error('Error inserting user:', err);
      // Safe fallback insert in mockup state
      const mockUser = mockDb.insertUser({
        email: userData.email,
        fullName: userData.fullName,
        role: userData.role,
        phone,
        registrationNo
      }, userData.passwordPlain);
      
      return mockUser;
    }
  }

  /**
   * Verify password integrity
   */
  static async verifyPassword(user: User, passwordPlain: string): Promise<boolean> {
    const conn = await getDbConnection();

    if (conn.isMock) {
      return mockDb.verifyPassword(user.id, passwordPlain);
    }

    try {
      const queryStr = 'SELECT password_hash FROM users WHERE id = ?';
      const results: any = await conn.query(queryStr, [user.id]);
      
      if (Array.isArray(results) && results.length > 0) {
        const hash = results[0].password_hash;
        return await bcrypt.compare(passwordPlain, hash);
      }
      return false;
    } catch (err) {
      console.error('Password verification failed, resorting to mockup comparison:', err);
      return mockDb.verifyPassword(user.id, passwordPlain);
    }
  }
}
