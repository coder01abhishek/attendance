import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import WorkSession from '@/lib/models/WorkSession';
import User from '@/lib/models/User';
import ActivityLog from '@/lib/models/ActivityLog';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const { userId, type, metadata } = await request.json();
    const now = new Date();
    
    // Find active session
    const session = await WorkSession.findOne({ userId, isActive: true });
    if (!session) {
      return NextResponse.json({ error: 'No active session found' }, { status: 400 });
    }
    
    if (type === 'activity') {
      // Update session activity count
      session.activityCount += 1;
      
      // Calculate active time (only if not paused)
      const user = await User.findById(userId);
      if (user && !user.isPaused) {
        const lastActivity = user.lastActivity ? new Date(user.lastActivity) : new Date(session.checkInTime);
        const timeDiff = Math.floor((now.getTime() - lastActivity.getTime()) / 60000);
        
        // Only add time if it's reasonable (less than 10 minutes since last activity)
        if (timeDiff <= 10) {
          session.totalActiveTime += Math.max(1, timeDiff);
        }
      }
      
      await session.save();
      
      // Update user last activity
      await User.findByIdAndUpdate(userId, {
        lastActivity: now,
      });
      
      // Log activity
      await new ActivityLog({
        userId,
        sessionId: session._id,
        type: 'activity',
        timestamp: now,
        metadata,
      }).save();
      
      return NextResponse.json({ success: true });
    }
    
    if (type === 'idle-start') {
      // Log idle start
      await new ActivityLog({
        userId,
        sessionId: session._id,
        type: 'idle-start',
        timestamp: now,
      }).save();
      
      return NextResponse.json({ success: true });
    }
    
    if (type === 'idle-end') {
      // Calculate idle time
      const lastIdleStart = await ActivityLog.findOne({
        userId,
        sessionId: session._id,
        type: 'idle-start',
      }).sort({ timestamp: -1 });
      
      if (lastIdleStart) {
        const idleDuration = Math.floor((now.getTime() - new Date(lastIdleStart.timestamp).getTime()) / 60000);
        session.idleTime += idleDuration;
        await session.save();
      }
      
      // Update user last activity
      await User.findByIdAndUpdate(userId, {
        lastActivity: now,
      });
      
      // Log idle end
      await new ActivityLog({
        userId,
        sessionId: session._id,
        type: 'idle-end',
        timestamp: now,
      }).save();
      
      return NextResponse.json({ success: true });
    }
    
    return NextResponse.json({ error: 'Invalid activity type' }, { status: 400 });
  } catch (error) {
    console.error('Activity tracking error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '50');
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }
    
    const activities = await ActivityLog.find({ userId })
      .sort({ timestamp: -1 })
      .limit(limit);
    
    return NextResponse.json(activities);
  } catch (error) {
    console.error('Get activities error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}