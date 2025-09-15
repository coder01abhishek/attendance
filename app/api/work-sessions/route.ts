import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import WorkSession from '@/lib/models/WorkSession';
import User from '@/lib/models/User';
import ActivityLog from '@/lib/models/ActivityLog';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }
    
    const sessions = await WorkSession.find({ userId }).sort({ createdAt: -1 });
    return NextResponse.json(sessions);
  } catch (error) {
    console.error('Get work sessions error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const { userId, action } = await request.json();
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    
    if (action === 'check-in') {
      // Create new work session
      const session = new WorkSession({
        userId,
        checkInTime: now,
        date: today,
        isActive: true,
      });
      
      await session.save();
      
      // Update user status
      await User.findByIdAndUpdate(userId, {
        isCheckedIn: true,
        isPaused: false,
        lastActivity: now,
      });
      
      // Log activity
      await new ActivityLog({
        userId,
        sessionId: session._id,
        type: 'check-in',
        timestamp: now,
      }).save();
      
      return NextResponse.json(session);
    }
    
    if (action === 'check-out') {
      // Find active session
      const session = await WorkSession.findOne({ userId, isActive: true });
      if (!session) {
        return NextResponse.json({ error: 'No active session found' }, { status: 400 });
      }
      
      // Update session
      session.checkOutTime = now;
      session.isActive = false;
      await session.save();
      
      // Update user status and total working time
      const user = await User.findById(userId);
      if (user) {
        user.isCheckedIn = false;
        user.isPaused = false;
        user.totalWorkingTime += session.totalActiveTime;
        user.lastActivity = now;
        await user.save();
      }
      
      // Log activity
      await new ActivityLog({
        userId,
        sessionId: session._id,
        type: 'check-out',
        timestamp: now,
      }).save();
      
      return NextResponse.json(session);
    }
    
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Work session error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}