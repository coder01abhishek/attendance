export interface User {
  id: string;
  username: string;
  name: string;
  password: string;
  role: 'user' | 'admin';
  createdAt: string;
  isCheckedIn: boolean;
  lastActivity: string;
  totalWorkingTime: number; // in minutes
}

export interface ActivityLog {
  id: string;
  userId: string;
  type: 'check-in' | 'check-out' | 'idle-start' | 'idle-end' | 'activity';
  timestamp: string;
  metadata?: any;
}

export interface WorkSession {
  id: string;
  userId: string;
  checkInTime: string;
  checkOutTime?: string;
  totalActiveTime: number; // in minutes
  idleTime: number; // in minutes
  activityCount: number;
  date: string;
}

export interface AuthUser {
  id: string;
  username: string;
  name: string;
  role: 'user' | 'admin';
}

export interface AuthContextType {
  user: AuthUser | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}