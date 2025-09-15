'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface ActivityState {
  isActive: boolean;
  isPaused: boolean;
  isIdle: boolean;
  lastActivity: Date;
  sessionId: string | null;
  totalActiveTime: number;
  activityCount: number;
}

export const useActivityTracker = () => {
  const { user } = useAuth();
  const [activityState, setActivityState] = useState<ActivityState>({
    isActive: false,
    isPaused: false,
    isIdle: false,
    lastActivity: new Date(),
    sessionId: null,
    totalActiveTime: 0,
    activityCount: 0
  });

  const idleTimeoutRef = useRef<NodeJS.Timeout>();
  const activityIntervalRef = useRef<NodeJS.Timeout>();
  const mouseListenerRef = useRef<boolean>(false);
  const keyboardListenerRef = useRef<boolean>(false);
  
  const IDLE_THRESHOLD = 10 * 60 * 1000; // 10 minutes in milliseconds

  const recordActivity = useCallback(async () => {
    if (!user || !activityState.isActive || activityState.isPaused) return;

    try {
      await fetch('/api/activity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          type: 'activity',
          metadata: { source: 'user_interaction' }
        }),
      });

      setActivityState(prev => ({
        ...prev,
        lastActivity: new Date(),
        activityCount: prev.activityCount + 1,
        isIdle: false
      }));

      // Reset idle timeout
      if (idleTimeoutRef.current) {
        clearTimeout(idleTimeoutRef.current);
      }

      // Set new idle timeout
      idleTimeoutRef.current = setTimeout(() => {
        handleIdleStart();
      }, IDLE_THRESHOLD);

    } catch (error) {
      console.error('Error recording activity:', error);
    }
  }, [user, activityState.isActive, activityState.isPaused]);

  const handleIdleStart = useCallback(async () => {
    if (!user || !activityState.isActive) return;

    try {
      await fetch('/api/activity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          type: 'idle-start'
        }),
      });

      setActivityState(prev => ({
        ...prev,
        isIdle: true
      }));

    } catch (error) {
      console.error('Error handling idle start:', error);
    }
  }, [user, activityState.isActive]);

  const handleIdleEnd = useCallback(async () => {
    if (!user || !activityState.isActive) return;

    try {
      await fetch('/api/activity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          type: 'idle-end'
        }),
      });

      setActivityState(prev => ({
        ...prev,
        isIdle: false,
        lastActivity: new Date()
      }));

    } catch (error) {
      console.error('Error handling idle end:', error);
    }
  }, [user, activityState.isActive]);

  const setupEventListeners = useCallback(() => {
    if (mouseListenerRef.current || keyboardListenerRef.current) return;

    const handleUserActivity = () => {
      if (activityState.isIdle) {
        handleIdleEnd();
      }
      recordActivity();
    };

    // Mouse events
    document.addEventListener('mousemove', handleUserActivity);
    document.addEventListener('mousedown', handleUserActivity);
    document.addEventListener('mouseup', handleUserActivity);
    document.addEventListener('click', handleUserActivity);
    mouseListenerRef.current = true;

    // Keyboard events
    document.addEventListener('keydown', handleUserActivity);
    document.addEventListener('keyup', handleUserActivity);
    keyboardListenerRef.current = true;

    return () => {
      document.removeEventListener('mousemove', handleUserActivity);
      document.removeEventListener('mousedown', handleUserActivity);
      document.removeEventListener('mouseup', handleUserActivity);
      document.removeEventListener('click', handleUserActivity);
      document.removeEventListener('keydown', handleUserActivity);
      document.removeEventListener('keyup', handleUserActivity);
      mouseListenerRef.current = false;
      keyboardListenerRef.current = false;
    };
  }, [activityState.isIdle, recordActivity, handleIdleEnd]);

  const checkIn = async () => {
    if (!user) return;

    try {
      const response = await fetch('/api/work-sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          action: 'check-in'
        }),
      });

      if (response.ok) {
        const session = await response.json();
        setActivityState(prev => ({
          ...prev,
          isActive: true,
          isPaused: false,
          isIdle: false,
          sessionId: session._id,
          lastActivity: new Date(),
          totalActiveTime: 0,
          activityCount: 0
        }));

        // Setup activity monitoring
        setupEventListeners();
        
        // Start idle timeout
        idleTimeoutRef.current = setTimeout(() => {
          handleIdleStart();
        }, IDLE_THRESHOLD);
      }
    } catch (error) {
      console.error('Error checking in:', error);
    }
  };

  const checkOut = async () => {
    if (!user) return;

    try {
      await fetch('/api/work-sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          action: 'check-out'
        }),
      });

      setActivityState(prev => ({
        ...prev,
        isActive: false,
        isPaused: false,
        isIdle: false,
        sessionId: null
      }));

      // Clear timeouts and intervals
      if (idleTimeoutRef.current) {
        clearTimeout(idleTimeoutRef.current);
      }
      if (activityIntervalRef.current) {
        clearInterval(activityIntervalRef.current);
      }

    } catch (error) {
      console.error('Error checking out:', error);
    }
  };

  const pauseWork = async () => {
    if (!user || !activityState.isActive) return;

    try {
      await fetch('/api/work-sessions/pause', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          action: 'pause'
        }),
      });

      setActivityState(prev => ({
        ...prev,
        isPaused: true
      }));

      // Clear idle timeout when paused
      if (idleTimeoutRef.current) {
        clearTimeout(idleTimeoutRef.current);
      }

    } catch (error) {
      console.error('Error pausing work:', error);
    }
  };

  const resumeWork = async () => {
    if (!user || !activityState.isActive) return;

    try {
      await fetch('/api/work-sessions/pause', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          action: 'resume'
        }),
      });

      setActivityState(prev => ({
        ...prev,
        isPaused: false,
        lastActivity: new Date()
      }));

      // Restart idle timeout
      idleTimeoutRef.current = setTimeout(() => {
        handleIdleStart();
      }, IDLE_THRESHOLD);

    } catch (error) {
      console.error('Error resuming work:', error);
    }
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
    };
  }, []);

  // Load current session on mount
  useEffect(() => {
    const loadCurrentSession = async () => {
      if (!user) return;

      try {
        const response = await fetch(`/api/work-sessions?userId=${user.id}`);
        if (response.ok) {
          const sessions = await response.json();
          const activeSession = sessions.find((s: any) => s.isActive);
          
          if (activeSession) {
            setActivityState(prev => ({
              ...prev,
              isActive: true,
              sessionId: activeSession._id,
              totalActiveTime: activeSession.totalActiveTime,
              activityCount: activeSession.activityCount
            }));

            setupEventListeners();
            
            // Start idle timeout
            idleTimeoutRef.current = setTimeout(() => {
              handleIdleStart();
            }, IDLE_THRESHOLD);
          }
        }
      } catch (error) {
        console.error('Error loading current session:', error);
      }
    };

    loadCurrentSession();
  }, [user, setupEventListeners, handleIdleStart]);

  return {
    ...activityState,
    checkIn,
    checkOut,
    pauseWork,
    resumeWork,
  };
};