import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import { User, ActivityLog, WorkSession } from '../types';
import { v4 as uuidv4 } from 'uuid';

class DatabaseManager {
  private db: Database.Database;

  constructor() {
    this.db = new Database('timetracker.db');
    this.initializeTables();
    this.seedData();
  }

  private initializeTables() {
    // Users table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'user',
        created_at TEXT NOT NULL,
        is_checked_in INTEGER DEFAULT 0,
        last_activity TEXT,
        total_working_time INTEGER DEFAULT 0
      )
    `);

    // Activity logs table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS activity_logs (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        type TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        metadata TEXT,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )
    `);

    // Work sessions table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS work_sessions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        check_in_time TEXT NOT NULL,
        check_out_time TEXT,
        total_active_time INTEGER DEFAULT 0,
        idle_time INTEGER DEFAULT 0,
        activity_count INTEGER DEFAULT 0,
        date TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )
    `);
  }

  private seedData() {
    const adminExists = this.db.prepare('SELECT COUNT(*) as count FROM users WHERE role = ?').get('admin') as any;
    
    if (adminExists.count === 0) {
      // Create default admin
      const adminId = uuidv4();
      const hashedPassword = bcrypt.hashSync('admin123', 10);
      
      this.db.prepare(`
        INSERT INTO users (id, username, name, password, role, created_at, last_activity)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(adminId, 'admin', 'System Administrator', hashedPassword, 'admin', new Date().toISOString(), new Date().toISOString());

      // Create sample user
      const userId = uuidv4();
      const userPassword = bcrypt.hashSync('user123', 10);
      
      this.db.prepare(`
        INSERT INTO users (id, username, name, password, role, created_at, last_activity)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(userId, 'john.doe', 'John Doe', userPassword, 'user', new Date().toISOString(), new Date().toISOString());
    }
  }

  // User management
  createUser(username: string, name: string, password: string): User {
    const id = uuidv4();
    const hashedPassword = bcrypt.hashSync(password, 10);
    const now = new Date().toISOString();

    this.db.prepare(`
      INSERT INTO users (id, username, name, password, role, created_at, last_activity)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, username, name, hashedPassword, 'user', now, now);

    return this.getUserById(id)!;
  }

  getUserById(id: string): User | null {
    const row = this.db.prepare('SELECT * FROM users WHERE id = ?').get(id) as any;
    if (!row) return null;
    
    return {
      id: row.id,
      username: row.username,
      name: row.name,
      password: row.password,
      role: row.role,
      createdAt: row.created_at,
      isCheckedIn: Boolean(row.is_checked_in),
      lastActivity: row.last_activity,
      totalWorkingTime: row.total_working_time
    };
  }

  getUserByUsername(username: string): User | null {
    const row = this.db.prepare('SELECT * FROM users WHERE username = ?').get(username) as any;
    if (!row) return null;
    
    return {
      id: row.id,
      username: row.username,
      name: row.name,
      password: row.password,
      role: row.role,
      createdAt: row.created_at,
      isCheckedIn: Boolean(row.is_checked_in),
      lastActivity: row.last_activity,
      totalWorkingTime: row.total_working_time
    };
  }

  getAllUsers(): User[] {
    const rows = this.db.prepare('SELECT * FROM users ORDER BY created_at DESC').all() as any[];
    
    return rows.map(row => ({
      id: row.id,
      username: row.username,
      name: row.name,
      password: row.password,
      role: row.role,
      createdAt: row.created_at,
      isCheckedIn: Boolean(row.is_checked_in),
      lastActivity: row.last_activity,
      totalWorkingTime: row.total_working_time
    }));
  }

  updateUserCheckInStatus(userId: string, isCheckedIn: boolean) {
    this.db.prepare('UPDATE users SET is_checked_in = ?, last_activity = ? WHERE id = ?')
      .run(isCheckedIn ? 1 : 0, new Date().toISOString(), userId);
  }

  updateUserActivity(userId: string) {
    this.db.prepare('UPDATE users SET last_activity = ? WHERE id = ?')
      .run(new Date().toISOString(), userId);
  }

  // Activity logging
  logActivity(userId: string, type: ActivityLog['type'], metadata?: any): string {
    const id = uuidv4();
    this.db.prepare(`
      INSERT INTO activity_logs (id, user_id, type, timestamp, metadata)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, userId, type, new Date().toISOString(), metadata ? JSON.stringify(metadata) : null);
    
    return id;
  }

  getActivityLogs(userId: string, limit = 100): ActivityLog[] {
    const rows = this.db.prepare(`
      SELECT * FROM activity_logs 
      WHERE user_id = ? 
      ORDER BY timestamp DESC 
      LIMIT ?
    `).all(userId, limit) as any[];

    return rows.map(row => ({
      id: row.id,
      userId: row.user_id,
      type: row.type,
      timestamp: row.timestamp,
      metadata: row.metadata ? JSON.parse(row.metadata) : undefined
    }));
  }

  // Work sessions
  createWorkSession(userId: string): string {
    const id = uuidv4();
    const now = new Date();
    const date = now.toISOString().split('T')[0]; // YYYY-MM-DD format
    
    this.db.prepare(`
      INSERT INTO work_sessions (id, user_id, check_in_time, date)
      VALUES (?, ?, ?, ?)
    `).run(id, userId, now.toISOString(), date);
    
    return id;
  }

  endWorkSession(sessionId: string, totalActiveTime: number, idleTime: number, activityCount: number) {
    this.db.prepare(`
      UPDATE work_sessions 
      SET check_out_time = ?, total_active_time = ?, idle_time = ?, activity_count = ?
      WHERE id = ?
    `).run(new Date().toISOString(), totalActiveTime, idleTime, activityCount, sessionId);
  }

  getCurrentWorkSession(userId: string): WorkSession | null {
    const row = this.db.prepare(`
      SELECT * FROM work_sessions 
      WHERE user_id = ? AND check_out_time IS NULL 
      ORDER BY check_in_time DESC 
      LIMIT 1
    `).get(userId) as any;
    
    if (!row) return null;
    
    return {
      id: row.id,
      userId: row.user_id,
      checkInTime: row.check_in_time,
      checkOutTime: row.check_out_time,
      totalActiveTime: row.total_active_time,
      idleTime: row.idle_time,
      activityCount: row.activity_count,
      date: row.date
    };
  }

  getWorkSessions(userId: string): WorkSession[] {
    const rows = this.db.prepare(`
      SELECT * FROM work_sessions 
      WHERE user_id = ? 
      ORDER BY check_in_time DESC
    `).all(userId) as any[];

    return rows.map(row => ({
      id: row.id,
      userId: row.user_id,
      checkInTime: row.check_in_time,
      checkOutTime: row.check_out_time,
      totalActiveTime: row.total_active_time,
      idleTime: row.idle_time,
      activityCount: row.activity_count,
      date: row.date
    }));
  }

  close() {
    this.db.close();
  }
}

// Singleton instance
let dbInstance: DatabaseManager;

export const getDatabase = (): DatabaseManager => {
  if (!dbInstance) {
    dbInstance = new DatabaseManager();
  }
  return dbInstance;
};