'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { User, Lock, AlertCircle } from 'lucide-react';

export const LoginForm: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const success = await login(username, password);
    if (!success) {
      setError('Invalid username or password');
    }
    
    setIsLoading(false);
  };

  const quickLogin = (user: string, pass: string) => {
    setUsername(user);
    setPassword(pass);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
      <div className="bg-slate-800 rounded-2xl shadow-2xl p-8 w-full max-w-md border border-slate-700">
        <div className="text-center mb-8">
          <div className="bg-blue-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Time Tracker</h1>
          <p className="text-slate-400">Sign in to your account</p>
        </div>

        {error && (
          <div className="bg-red-900/50 border border-red-500 rounded-lg p-3 mb-6 flex items-center">
            <AlertCircle className="w-5 h-5 text-red-400 mr-2" />
            <span className="text-red-200">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-slate-300 mb-2">
              Username
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                id="username"
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg pl-10 pr-4 py-3 text-white placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                placeholder="Enter your username"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg pl-10 pr-4 py-3 text-white placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                placeholder="Enter your password"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-700">
          <div className="text-center text-sm text-slate-400 mb-4">
            <div className="mb-2 font-medium">Demo Credentials:</div>
          </div>
          
          <div className="space-y-2">
            <button
              onClick={() => quickLogin('admin', 'admin123')}
              className="w-full bg-slate-700 hover:bg-slate-600 text-slate-300 py-2 px-3 rounded text-sm transition-colors"
            >
              Admin: admin / admin123
            </button>
            <button
              onClick={() => quickLogin('john.doe', 'user123')}
              className="w-full bg-slate-700 hover:bg-slate-600 text-slate-300 py-2 px-3 rounded text-sm transition-colors"
            >
              User: john.doe / user123
            </button>
            <button
              onClick={() => quickLogin('jane.smith', 'user123')}
              className="w-full bg-slate-700 hover:bg-slate-600 text-slate-300 py-2 px-3 rounded text-sm transition-colors"
            >
              User: jane.smith / user123
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};