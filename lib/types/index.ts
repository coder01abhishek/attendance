export interface User {
  _id: string;
  username: string;
  name: string;
  password: string;
  role: 'user' | 'admin';
  isCheckedIn: boolean;
  isPaused: boolean;
  lastActivity: string;
  totalWorkingTime: number; // in minutes
  createdAt: string;
  updatedAt: string;
}

export interface WorkSession {
  _id: string;
  userId: string;
  checkInTime: string;
  checkOutTime?: string;
  totalActiveTime: number; // in minutes
  idleTime: number; // in minutes
  pausedTime: number; // in minutes
  activityCount: number;
  date: string;
  isActive: boolean;
  lastPauseTime?: string;
  lastResumeTime?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ActivityLog {
  _id: string;
  userId: string;
  sessionId?: string;
  type: 'check-in' | 'check-out' | 'activity' | 'idle-start' | 'idle-end' | 'manual-pause' | 'manual-resume';
  timestamp: string;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
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