import { User, ActivityLog, WorkSession } from '../types';

// Simple localStorage-based storage for demo
class LocalStorage {
  private getItem<T>(key: string, defaultValue: T): T {
    if (typeof window === 'undefined') return defaultValue;
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch {
      return defaultValue;
    }
  }

  private setItem<T>(key: string, value: T): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(key, JSON.stringify(value));
  }

  // Users
  getUsers(): User[] {
    return this.getItem('users', []);
  }

  setUsers(users: User[]): void {
    this.setItem('users', users);
  }

  getUserById(id: string): User | null {
    const users = this.getUsers();
    return users.find(user => user.id === id) || null;
  }

  getUserByUsername(username: string): User | null {
    const users = this.getUsers();
    return users.find(user => user.username === username) || null;
  }

  createUser(user: User): void {
    const users = this.getUsers();
    users.push(user);
    this.setUsers(users);
  }

  updateUser(updatedUser: User): void {
    const users = this.getUsers();
    const index = users.findIndex(user => user.id === updatedUser.id);
    if (index !== -1) {
      users[index] = updatedUser;
      this.setUsers(users);
    }
  }

  // Activity Logs
  getActivityLogs(): ActivityLog[] {
    return this.getItem('activityLogs', []);
  }

  setActivityLogs(logs: ActivityLog[]): void {
    this.setItem('activityLogs', logs);
  }

  addActivityLog(log: ActivityLog): void {
    const logs = this.getActivityLogs();
    logs.unshift(log); // Add to beginning
    // Keep only last 1000 logs
    if (logs.length > 1000) {
      logs.splice(1000);
    }
    this.setActivityLogs(logs);
  }

  getUserActivityLogs(userId: string, limit = 100): ActivityLog[] {
    const logs = this.getActivityLogs();
    return logs.filter(log => log.userId === userId).slice(0, limit);
  }

  // Work Sessions
  getWorkSessions(): WorkSession[] {
    return this.getItem('workSessions', []);
  }

  setWorkSessions(sessions: WorkSession[]): void {
    this.setItem('workSessions', sessions);
  }

  addWorkSession(session: WorkSession): void {
    const sessions = this.getWorkSessions();
    sessions.unshift(session);
    this.setWorkSessions(sessions);
  }

  updateWorkSession(updatedSession: WorkSession): void {
    const sessions = this.getWorkSessions();
    const index = sessions.findIndex(session => session.id === updatedSession.id);
    if (index !== -1) {
      sessions[index] = updatedSession;
      this.setWorkSessions(sessions);
    }
  }

  getUserWorkSessions(userId: string): WorkSession[] {
    const sessions = this.getWorkSessions();
    return sessions.filter(session => session.userId === userId);
  }

  getCurrentWorkSession(userId: string): WorkSession | null {
    const sessions = this.getUserWorkSessions(userId);
    return sessions.find(session => !session.checkOutTime) || null;
  }
}

export const storage = new LocalStorage();