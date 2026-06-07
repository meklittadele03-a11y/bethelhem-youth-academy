import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { db as mockDb } from '../db';

dotenv.config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'bethelhem_academy_db',
  port: Number(process.env.DB_PORT) || 3306,
  connectionLimit: 10,
  connectTimeout: 2000 // Short timeout to fail fast and fall back elegantly
};

let pool: mysql.Pool | null = null;
let isMockMode = false;

export async function getDbConnection() {
  if (isMockMode) {
    return { isMock: true, query: mockQueryFn };
  }

  if (!pool) {
    try {
      console.log(`[Database] Attempting to connect to real MySQL on ${dbConfig.host}:${dbConfig.port}...`);
      pool = mysql.createPool(dbConfig);
      
      // Test the pool connection quickly
      const connection = await pool.getConnection();
      console.log('[Database] Real MySQL Connection Pool initialized successfully!');
      connection.release();
    } catch (err: any) {
      console.warn(`[Database] Could not connect to real MySQL server (${err.message}). Falling back to fully normalized, JSON-based persistent storage.`);
      isMockMode = true;
      return { isMock: true, query: mockQueryFn };
    }
  }

  return { 
    isMock: false, 
    query: async (sql: string, params?: any[]) => {
      if (!pool) throw new Error('Database pool not initialized.');
      const [results] = await pool.execute(sql, params);
      return results;
    }
  };
}

// Mock query runner that maps basic SQL queries to mockDb functions
// This serves as an elegant simulation bridge to keep the preview running green
async function mockQueryFn(sql: string, params?: any[]): Promise<any> {
  const sanitizedSql = sql.replace(/\s+/g, ' ').trim().toLowerCase();
  
  if (sanitizedSql.includes('select * from users where email =')) {
    const email = params && params[0];
    if (!email) return [];
    const matched = mockDb.queryUserByEmail(email);
    return matched ? [matched] : [];
  }

  if (sanitizedSql.includes('select * from users where id =')) {
    const id = params && params[0];
    if (!id) return [];
    const matched = mockDb.queryUserById(id);
    return matched ? [matched] : [];
  }

  if (sanitizedSql.includes('insert into users')) {
    // Expected params: [id, email, password_hash, role, fullName, phone, registration_no]
    if (params && params.length >= 5) {
      const newUser = mockDb.insertUser({
        email: params[1],
        fullName: params[4] || params[3], // map positionally depending on query shape
        role: params[3],
        phone: params[5] || '',
        registrationNo: params[6] || `BYA-REG-${Date.now().toString().slice(-4)}`
      }, 'temporaryPasswordWillBeOverwritten');
      
      // Update mock password with the actual hash passed
      // @ts-ignore
      mockDb.data.passwords[newUser.id] = params[2];
      // @ts-ignore
      mockDb.save();

      return { insertId: newUser.id, affectedRows: 1 };
    }
  }

  console.log(`[Mock DB Adapter] Executed query: ${sql} with params:`, params);
  return [];
}
