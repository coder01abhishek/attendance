'use client';

import React from 'react';
import { AuthProvider, useAuth } from '@/lib/contexts/AuthContext';
import { LoginForm } from '@/components/LoginForm';
import { UserDashboard } from '@/components/UserDashboard';
import { AdminDashboard } from '@/components/AdminDashboard';

const AppContent: React.FC = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <LoginForm />;
  }

  return user.role === 'admin' ? <AdminDashboard /> : <UserDashboard />;
};

export default function Home() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}