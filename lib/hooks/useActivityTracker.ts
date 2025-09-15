'use client';

import { useEffect, useRef, useState } from 'react';
import { storage } from '../utils/storage';
import { useAuth } from '../contexts/AuthContext';
import { ActivityLog, WorkSession } from '../types';

interface ActivityState {
  isActive: boolean;
  lastActivity: Date;
  idleTime: number;
  sessionId: string | null;
  totalActiveTime: number;
  activityCount: number;
}

const generateId = () => Math.random().toString(36).substr(2, 9);

export const useActivityTracker = () => {
  const { user } = useAuth();
  const [activityState, setActivityState] = useState<ActivityState>({
    isActive: false,
    lastActivity: new Date(),
    idleTime: 0,
    sessionId: null,
    totalActiveTime: 0,
    activityCount: 0
  });

  const idleTimeoutRef = useRef<NodeJS.Timeout>();
  const activityIntervalRef = useRef<NodeJS.Timeout>();
  const activeTimeIntervalRef = useRef<NodeJS.Timeout>();
  const IDLE_THRESHOLD = 5 * 60 * 1000; // 5 minutes in milliseconds

  const recordActivity = () => {
    if (!user || !activityState.isActive) return;

    const now = new Date();
    
    // Update user's last activity
    const currentUser = storage.getUserById(user.id);
    if (currentUser) {
      currentUser.lastActivity = now.toISOString();
      storage.updateUser(currentUser);
    }
    
    // Log activity
    const activityLog: ActivityLog = {
      id: generateId(),
      userId: user.id,
      type: 'activity',
      timestamp: now.toISOString(),
      metadata: { type: 'simulated_activity' }
    };
    storage.addActivityLog(activityLog);

    setActivityState(prev => ({
      ...prev,
      lastActivity: now,
      activityCount: prev.activityCount + 1
    }));

    // Reset idle timeout
    if (idleTimeoutRef.current) {
      clearTimeout(idleTimeoutRef.current);
    }

    // Set new idle timeout
    idleTimeoutRef.current = setTimeout(() => {
      handleIdleStart();
    }, IDLE_THRESHOLD);
  };

  const handleIdleStart = () => {
    if (!user) return;

    const idleLog: ActivityLog = {
      id: generateId(),
      userId: user.id,
      type: 'idle-start',
      timestamp: new Date().toISOString()
    };
    storage.addActivityLog(idleLog);

    setActivityState(prev => ({
      ...prev,
      isActive: false
    }));

    // Auto checkout after idle
    setTimeout(() => {
      checkOut();
    }, 1000);
  };

  const handleIdleEnd = () => {
    if (!user) return;

    const idleEndLog: ActivityLog = {
      id: generateId(),
      userId: user.id,
      type: 'idle-end',
      timestamp: new Date().toISOString()
    };
    storage.addActivityLog(idleEndLog);

    setActivityState(prev => ({
      ...prev,
      isActive: true,
      lastActivity: new Date()
    }));
  };

  const checkIn = () => {
    if (!user) return;

    const now = new Date();
    const sessionId = generateId();
    const date = now.toISOString().split('T')[0]; // YYYY-MM-DD format

    // Create work session
    const workSession: WorkSession = {
      id: sessionId,
      userId: user.id,
      checkInTime: now.toISOString(),
      totalActiveTime: 0,
      idleTime: 0,
      activityCount: 0,
      date
    };
    storage.addWorkSession(workSession);

    // Update user status
    const currentUser = storage.getUserById(user.id);
    if (currentUser) {
      currentUser.isCheckedIn = true;
      currentUser.lastActivity = now.toISOString();
      storage.updateUser(currentUser);
    }

    // Log check-in
    const checkInLog: ActivityLog = {
      id: generateId(),
      userId: user.id,
      type: 'check-in',
      timestamp: now.toISOString()
    };
    storage.addActivityLog(checkInLog);

    setActivityState(prev => ({
      ...prev,
      isActive: true,
      sessionId,
      lastActivity: now,
      totalActiveTime: 0,
      activityCount: 0,
      idleTime: 0
    }));

    // Start activity simulation
    startActivitySimulation();
    startActiveTimeCounter();
  };

  const checkOut = () => {
    if (!user || !activityState.sessionId) return;

    const now = new Date();
    
    // End work session
    const currentSession = storage.getCurrentWorkSession(user.id);
    if (currentSession) {
      currentSession.checkOutTime = now.toISOString();
      currentSession.totalActiveTime = activityState.totalActiveTime;
      currentSession.idleTime = activityState.idleTime;
      currentSession.activityCount = activityState.activityCount;
      storage.updateWorkSession(currentSession);
    }

    // Update user status
    const currentUser = storage.getUserById(user.id);
    if (currentUser) {
      currentUser.isCheckedIn = false;
      currentUser.lastActivity = now.toISOString();
      currentUser.totalWorkingTime += activityState.totalActiveTime;
      storage.updateUser(currentUser);
    }

    // Log check-out
    const checkOutLog: ActivityLog = {
      id: generateId(),
      userId: user.id,
      type: 'check-out',
      timestamp: now.toISOString()
    };
    storage.addActivityLog(checkOutLog);

    setActivityState(prev => ({
      ...prev,
      isActive: false,
      sessionId: null
    }));

    // Clear timeouts
    if (idleTimeoutRef.current) {
      clearTimeout(idleTimeoutRef.current);
    }
    if (activityIntervalRef.current) {
      clearInterval(activityIntervalRef.current);
    }
    if (activeTimeIntervalRef.current) {
      clearInterval(activeTimeIntervalRef.current);
    }
  };

  const startActivitySimulation = () => {
    // Simulate random activity every 30-120 seconds
    const scheduleNextActivity = () => {
      const delay = Math.random() * 90000 + 30000; // 30-120 seconds
      activityIntervalRef.current = setTimeout(() => {
        if (activityState.isActive) {
          recordActivity();
          scheduleNextActivity();
        }
      }, delay);
    };

    scheduleNextActivity();
  };

  const startActiveTimeCounter = () => {
    // Update active time counter every minute
    activeTimeIntervalRef.current = setInterval(() => {
      setActivityState(prev => {
        if (prev.isActive && prev.sessionId) {
          return {
            ...prev,
            totalActiveTime: prev.totalActiveTime + 1 // increment by 1 minute
          };
        }
        return prev;
      });
    }, 60000); // every minute
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (idleTimeoutRef.current) {
        clearTimeout(idleTimeoutRef.current);
      }
      if (activityIntervalRef.current) {
        clearInterval(activityIntervalRef.current);
      }
      if (activeTimeIntervalRef.current) {
        clearInterval(activeTimeIntervalRef.current);
      }
    };
  }, []);

  // Check for existing session on mount
  useEffect(() => {
    if (user) {
      const currentSession = storage.getCurrentWorkSession(user.id);
      if (currentSession) {
        const now = new Date();
        const checkInTime = new Date(currentSession.checkInTime);
        const minutesActive = Math.floor((now.getTime() - checkInTime.getTime()) / 60000);
        
        setActivityState(prev => ({
          ...prev,
          isActive: true,
          sessionId: currentSession.id,
          totalActiveTime: minutesActive,
          activityCount: currentSession.activityCount
        }));

        startActivitySimulation();
        startActiveTimeCounter();
      }
    }
  }, [user]);

  return {
    ...activityState,
    checkIn,
    checkOut,
    recordActivity
  };
};