import { storage } from './storage';

// Simple password hashing (for demo - use bcrypt in production)
const simpleHash = (password: string): string => {
  return btoa(password + 'salt123');
};

const verifyPassword = (password: string, hash: string): boolean => {
  return simpleHash(password) === hash;
};

export interface TokenPayload {
  id: string;
  username: string;
  name: string;
  role: 'user' | 'admin';
}

export const generateToken = (payload: TokenPayload): string => {
  // Simple token (for demo - use JWT in production)
  return btoa(JSON.stringify(payload));
};

export const verifyToken = (token: string): TokenPayload | null => {
  try {
    return JSON.parse(atob(token));
  } catch {
    return null;
  }
};

export const authenticateUser = (username: string, password: string): { token: string; user: TokenPayload } | null => {
  const user = storage.getUserByUsername(username);
  
  if (!user) {
    return null;
  }
  
  const isPasswordValid = verifyPassword(password, user.password);
  if (!isPasswordValid) {
    return null;
  }
  
  const tokenPayload: TokenPayload = {
    id: user.id,
    username: user.username,
    name: user.name,
    role: user.role
  };
  
  const token = generateToken(tokenPayload);
  
  return { token, user: tokenPayload };
};

export const hashPassword = simpleHash;