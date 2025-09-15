'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useActivityTracker } from '@/lib/hooks/useActivityTracker';
import { ActivityLog, WorkSession } from '@/lib/types';
import { 
  Clock, 
  Play, 
  Square, 
  Activity, 
  Download, 
  Calendar,
  Timer,
  MousePointer,
  LogOut,
  Pause,
  PlayCircle,
  AlertCircle
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

export const UserDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const activityTracker = useActivityTracker();
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [workSessions, setWorkSessions] = useState<WorkSession[]>([]);

  useEffect(() => {
    if (user) {
      loadUserData();
      const interval = setInterval(loadUserData, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [user]);

  const loadUserData = async () => {
    if (!user) return;
    
    try {
      // Load activity logs
      const activityResponse = await fetch(`/api/activity?userId=${user.id}&limit=50`);
      if (activityResponse.ok) {
        const activities = await activityResponse.json();
        setActivityLogs(activities);
      }

      // Load work sessions
      const sessionsResponse = await fetch(`/api/work-sessions?userId=${user.id}`);
      if (sessionsResponse.ok) {
        const sessions = await sessionsResponse.json();
        setWorkSessions(sessions);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const exportData = (format: 'json' | 'csv') => {
    if (!user) return;
    
    const data = {
      user: {
        name: user.name,
        username: user.username
      },
      workSessions,
      activityLogs,
      exportDate: new Date().toISOString()
    };

    if (format === 'json') {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `timetracker-${user.username}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else {
      // CSV export for work sessions
      const csvHeaders = 'Date,Check In,Check Out,Active Time (min),Idle Time (min),Paused Time (min),Activity Count\n';
      const csvData = workSessions.map(session => 
        `${session.date},${session.checkInTime},${session.checkOutTime || 'In Progress'},${session.totalActiveTime},${session.idleTime},${session.pausedTime},${session.activityCount}`
      ).join('\n');
      
      const blob = new Blob([csvHeaders + csvData], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `timetracker-${user.username}-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const getActivityTypeIcon = (type: ActivityLog['type']) => {
    switch (type) {
      case 'check-in':
        return <Play className="w-4 h-4 text-green-400" />;
      case 'check-out':
        return <Square className="w-4 h-4 text-red-400" />;
      case 'activity':
        return <MousePointer className="w-4 h-4 text-blue-400" />;
      case 'idle-start':
        return <Timer className="w-4 h-4 text-yellow-400" />;
      case 'idle-end':
        return <Activity className="w-4 h-4 text-green-400" />;
      case 'manual-pause':
        return <Pause className="w-4 h-4 text-orange-400" />;
      case 'manual-resume':
        return <PlayCircle className="w-4 h-4 text-green-400" />;
      default:
        return <Clock className="w-4 h-4 text-slate-400" />;
    }
  };

  const getStatusDisplay = () => {
    if (!activityTracker.isActive) {
      return { text: 'Not Working', color: 'text-slate-400', bgColor: 'bg-slate-600' };
    }
    if (activityTracker.isPaused) {
      return { text: 'Paused', color: 'text-orange-400', bgColor: 'bg-orange-600' };
    }
    if (activityTracker.isIdle) {
      return { text: 'Idle', color: 'text-yellow-400', bgColor: 'bg-yellow-600' };
    }
    return { text: 'Working', color: 'text-green-400', bgColor: 'bg-green-600' };
  };

  const status = getStatusDisplay();

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <div className="bg-slate-800 border-b border-slate-700 p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Time Tracker Dashboard</h1>
            <p className="text-slate-400">Welcome back, {user?.name}</p>
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
        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Status</p>
                <p className={`text-xl font-semibold ${status.color}`}>
                  {status.text}
                </p>
                {activityTracker.isIdle && (
                  <p className="text-xs text-yellow-300 mt-1">
                    <AlertCircle className="w-3 h-3 inline mr-1" />
                    Idle for 10+ minutes
                  </p>
                )}
              </div>
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${status.bgColor}`}>
                {activityTracker.isActive ? 
                  (activityTracker.isPaused ? <Pause className="w-6 h-6" /> : <Activity className="w-6 h-6" />) : 
                  <Clock className="w-6 h-6" />
                }
              </div>
            </div>
          </div>

          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Active Time Today</p>
                <p className="text-xl font-semibold">{formatTime(activityTracker.totalActiveTime)}</p>
              </div>
              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                <Timer className="w-6 h-6" />
              </div>
            </div>
          </div>

          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Activity Count</p>
                <p className="text-xl font-semibold">{activityTracker.activityCount}</p>
              </div>
              <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center">
                <MousePointer className="w-6 h-6" />
              </div>
            </div>
          </div>

          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Last Activity</p>
                <p className="text-xl font-semibold">
                  {formatDistanceToNow(activityTracker.lastActivity, { addSuffix: true })}
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-600 rounded-full flex items-center justify-center">
                <Calendar className="w-6 h-6" />
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h2 className="text-xl font-semibold mb-4">Actions</h2>
          <div className="flex gap-4 flex-wrap">
            {!activityTracker.isActive ? (
              <button
                onClick={activityTracker.checkIn}
                className="bg-green-600 hover:bg-green-700 px-6 py-3 rounded-lg transition-colors flex items-center"
              >
                <Play className="w-5 h-5 mr-2" />
                Check In
              </button>
            ) : (
              <>
                <button
                  onClick={activityTracker.checkOut}
                  className="bg-red-600 hover:bg-red-700 px-6 py-3 rounded-lg transition-colors flex items-center"
                >
                  <Square className="w-5 h-5 mr-2" />
                  Check Out
                </button>
                
                {activityTracker.isPaused ? (
                  <button
                    onClick={activityTracker.resumeWork}
                    className="bg-green-600 hover:bg-green-700 px-6 py-3 rounded-lg transition-colors flex items-center"
                  >
                    <PlayCircle className="w-5 h-5 mr-2" />
                    Resume Work
                  </button>
                ) : (
                  <button
                    onClick={activityTracker.pauseWork}
                    className="bg-orange-600 hover:bg-orange-700 px-6 py-3 rounded-lg transition-colors flex items-center"
                  >
                    <Pause className="w-5 h-5 mr-2" />
                    Pause Work
                  </button>
                )}
              </>
            )}
            
            <button
              onClick={() => exportData('json')}
              className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg transition-colors flex items-center"
            >
              <Download className="w-5 h-5 mr-2" />
              Export JSON
            </button>
            
            <button
              onClick={() => exportData('csv')}
              className="bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-lg transition-colors flex items-center"
            >
              <Download className="w-5 h-5 mr-2" />
              Export CSV
            </button>
          </div>
        </div>

        {/* Work Sessions */}
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h2 className="text-xl font-semibold mb-4">Recent Work Sessions</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-2 px-4 text-slate-400">Date</th>
                  <th className="text-left py-2 px-4 text-slate-400">Check In</th>
                  <th className="text-left py-2 px-4 text-slate-400">Check Out</th>
                  <th className="text-left py-2 px-4 text-slate-400">Active Time</th>
                  <th className="text-left py-2 px-4 text-slate-400">Idle Time</th>
                  <th className="text-left py-2 px-4 text-slate-400">Paused Time</th>
                  <th className="text-left py-2 px-4 text-slate-400">Activities</th>
                </tr>
              </thead>
              <tbody>
                {workSessions.slice(0, 10).map((session) => (
                  <tr key={session._id} className="border-b border-slate-700/50">
                    <td className="py-3 px-4">{format(new Date(session.date), 'MMM dd, yyyy')}</td>
                    <td className="py-3 px-4">{format(new Date(session.checkInTime), 'HH:mm')}</td>
                    <td className="py-3 px-4">
                      {session.checkOutTime ? format(new Date(session.checkOutTime), 'HH:mm') : 'In Progress'}
                    </td>
                    <td className="py-3 px-4">{formatTime(session.totalActiveTime)}</td>
                    <td className="py-3 px-4">{formatTime(session.idleTime)}</td>
                    <td className="py-3 px-4">{formatTime(session.pausedTime)}</td>
                    <td className="py-3 px-4">{session.activityCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {workSessions.length === 0 && (
              <div className="text-center py-8 text-slate-400">
                <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No work sessions yet. Check in to start tracking!</p>
              </div>
            )}
          </div>
        </div>

        {/* Activity Logs */}
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {activityLogs.slice(0, 20).map((log) => (
              <div key={log._id} className="flex items-center gap-3 p-3 bg-slate-700/50 rounded-lg">
                {getActivityTypeIcon(log.type)}
                <div className="flex-1">
                  <p className="font-medium capitalize">{log.type.replace('-', ' ')}</p>
                  <p className="text-sm text-slate-400">
                    {format(new Date(log.timestamp), 'MMM dd, yyyy HH:mm:ss')}
                  </p>
                </div>
              </div>
            ))}
            {activityLogs.length === 0 && (
              <div className="text-center py-8 text-slate-400">
                <Activity className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No activity logs yet. Start working to see your activity!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};