'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { User } from '@/lib/types';
import { 
  Users, 
  UserPlus, 
  Activity, 
  Clock, 
  Shield,
  LogOut,
  Eye,
  EyeOff,
  Plus,
  X
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

export const AdminDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newUser, setNewUser] = useState({
    username: '',
    name: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadUsers();
    const interval = setInterval(loadUsers, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const loadUsers = async () => {
    try {
      const response = await fetch('/api/users');
      if (response.ok) {
        const usersData = await response.json();
        setUsers(usersData);
      }
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newUser),
      });

      if (response.ok) {
        setSuccess('User created successfully!');
        setNewUser({ username: '', name: '', password: '' });
        setShowCreateForm(false);
        loadUsers();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to create user');
        setTimeout(() => setError(''), 3000);
      }
    } catch (error) {
      setError('Failed to create user');
      setTimeout(() => setError(''), 3000);
    }
  };

  const getStatusColor = (user: User) => {
    if (user.isCheckedIn) {
      if (user.isPaused) {
        return 'text-orange-400 bg-orange-400/10';
      }
      return 'text-green-400 bg-green-400/10';
    }
    return 'text-slate-400 bg-slate-400/10';
  };

  const getStatusText = (user: User) => {
    if (user.isCheckedIn) {
      if (user.isPaused) {
        return 'Paused';
      }
      return 'Working';
    }
    return 'Offline';
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <div className="bg-slate-800 border-b border-slate-700 p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center">
            <Shield className="w-8 h-8 text-blue-400 mr-3" />
            <div>
              <h1 className="text-2xl font-bold">Admin Dashboard</h1>
              <p className="text-slate-400">Manage users and monitor activity</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-lg transition-colors flex items-center"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Total Users</p>
                <p className="text-2xl font-bold">{users.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                <Users className="w-6 h-6" />
              </div>
            </div>
          </div>

          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Active Users</p>
                <p className="text-2xl font-bold">{users.filter(u => u.isCheckedIn && !u.isPaused).length}</p>
              </div>
              <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center">
                <Activity className="w-6 h-6" />
              </div>
            </div>
          </div>

          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Total Work Time</p>
                <p className="text-2xl font-bold">
                  {formatTime(users.reduce((total, user) => total + user.totalWorkingTime, 0))}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center">
                <Clock className="w-6 h-6" />
              </div>
            </div>
          </div>
        </div>

        {/* Success/Error Messages */}
        {error && (
          <div className="bg-red-900/50 border border-red-500 rounded-lg p-4">
            <p className="text-red-200">{error}</p>
          </div>
        )}
        {success && (
          <div className="bg-green-900/50 border border-green-500 rounded-lg p-4">
            <p className="text-green-200">{success}</p>
          </div>
        )}

        {/* Actions */}
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">User Management</h2>
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors flex items-center"
            >
              {showCreateForm ? <X className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
              {showCreateForm ? 'Cancel' : 'Add User'}
            </button>
          </div>

          {/* Create User Form */}
          {showCreateForm && (
            <div className="bg-slate-700 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold mb-4">Create New User</h3>
              <form onSubmit={handleCreateUser} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Username
                  </label>
                  <input
                    type="text"
                    required
                    value={newUser.username}
                    onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                    className="w-full bg-slate-600 border border-slate-500 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    placeholder="Enter username"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={newUser.name}
                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                    className="w-full bg-slate-600 border border-slate-500 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    placeholder="Enter full name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={newUser.password}
                      onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                      className="w-full bg-slate-600 border border-slate-500 rounded-lg px-3 py-2 pr-10 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                      placeholder="Enter password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-300"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div className="md:col-span-3 flex justify-end">
                  <button
                    type="submit"
                    className="bg-green-600 hover:bg-green-700 px-6 py-2 rounded-lg transition-colors flex items-center"
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Create User
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Users Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-3 px-4 text-slate-400">Name</th>
                  <th className="text-left py-3 px-4 text-slate-400">Username</th>
                  <th className="text-left py-3 px-4 text-slate-400">Status</th>
                  <th className="text-left py-3 px-4 text-slate-400">Last Activity</th>
                  <th className="text-left py-3 px-4 text-slate-400">Total Work Time</th>
                  <th className="text-left py-3 px-4 text-slate-400">Created</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user._id} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                    <td className="py-4 px-4 font-medium">{user.name}</td>
                    <td className="py-4 px-4 text-slate-300">{user.username}</td>
                    <td className="py-4 px-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(user)}`}>
                        {getStatusText(user)}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-slate-300">
                      {user.lastActivity ? formatDistanceToNow(new Date(user.lastActivity), { addSuffix: true }) : 'Never'}
                    </td>
                    <td className="py-4 px-4 text-slate-300">{formatTime(user.totalWorkingTime)}</td>
                    <td className="py-4 px-4 text-slate-300">
                      {format(new Date(user.createdAt), 'MMM dd, yyyy')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {users.length === 0 && (
              <div className="text-center py-12 text-slate-400">
                <Users className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>No users found. Create your first user to get started.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};