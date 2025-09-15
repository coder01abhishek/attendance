import { User } from '../types';
import { storage } from './storage';
import { hashPassword } from './auth';

const generateId = () => Math.random().toString(36).substr(2, 9);

export const initializeSeedData = () => {
  const existingUsers = storage.getUsers();
  
  if (existingUsers.length === 0) {
    const seedUsers: User[] = [
      {
        id: generateId(),
        username: 'admin',
        name: 'System Administrator',
        password: hashPassword('admin123'),
        role: 'admin',
        createdAt: new Date().toISOString(),
        isCheckedIn: false,
        lastActivity: new Date().toISOString(),
        totalWorkingTime: 0
      },
      {
        id: generateId(),
        username: 'john.doe',
        name: 'John Doe',
        password: hashPassword('user123'),
        role: 'user',
        createdAt: new Date().toISOString(),
        isCheckedIn: false,
        lastActivity: new Date().toISOString(),
        totalWorkingTime: 480 // 8 hours in minutes
      },
      {
        id: generateId(),
        username: 'jane.smith',
        name: 'Jane Smith',
        password: hashPassword('user123'),
        role: 'user',
        createdAt: new Date().toISOString(),
        isCheckedIn: true,
        lastActivity: new Date().toISOString(),
        totalWorkingTime: 360 // 6 hours in minutes
      },
      {
        id: generateId(),
        username: 'mike.wilson',
        name: 'Mike Wilson',
        password: hashPassword('user123'),
        role: 'user',
        createdAt: new Date().toISOString(),
        isCheckedIn: false,
        lastActivity: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
        totalWorkingTime: 720 // 12 hours in minutes
      },
      {
        id: generateId(),
        username: 'sarah.johnson',
        name: 'Sarah Johnson',
        password: hashPassword('user123'),
        role: 'user',
        createdAt: new Date().toISOString(),
        isCheckedIn: true,
        lastActivity: new Date().toISOString(),
        totalWorkingTime: 240 // 4 hours in minutes
      }
    ];

    storage.setUsers(seedUsers);
    console.log('Seed data initialized with users:', seedUsers.map(u => ({ username: u.username, role: u.role })));
  }
};