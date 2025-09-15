'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AuthContextType, AuthUser } from '../types';
import { authenticateUser, verifyToken } from '../utils/auth';
import { initializeSeedData } from '../utils/seedData';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Initialize seed data
    initializeSeedData();
    
    // Check for existing token on app load
    const token = localStorage.getItem('auth_token');
    if (token) {
      const decoded = verifyToken(token);
      if (decoded) {
        setUser({
          id: decoded.id,
          username: decoded.username,
          name: decoded.name,
          role: decoded.role
        });
      } else {
        localStorage.removeItem('auth_token');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const result = authenticateUser(username, password);
      if (result) {
        localStorage.setItem('auth_token', result.token);
        setUser({
          id: result.user.id,
          username: result.user.username,
          name: result.user.name,
          role: result.user.role
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};