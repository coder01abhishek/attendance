import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import WorkSession from '@/lib/models/WorkSession';
import User from '@/lib/models/User';
import ActivityLog from '@/lib/models/ActivityLog';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const { userId, action } = await request.json();
    const now = new Date();
    
    // Find active session
    const session = await WorkSession.findOne({ userId, isActive: true });
    if (!session) {
      return NextResponse.json({ error: 'No active session found' }, { status: 400 });
    }
    
    if (action === 'pause') {
      // Update session
      session.lastPauseTime = now;
      await session.save();
      
      // Update user status
      await User.findByIdAndUpdate(userId, {
        isPaused: true,
        lastActivity: now,
      });
      
      // Log activity
      await new ActivityLog({
        userId,
        sessionId: session._id,
        type: 'manual-pause',
        timestamp: now,
      }).save();
      
      return NextResponse.json({ success: true, message: 'Work paused' });
    }
    
    if (action === 'resume') {
      // Calculate paused time if there was a pause
      if (session.lastPauseTime) {
        const pausedDuration = Math.floor((now.getTime() - new Date(session.lastPauseTime).getTime()) / 60000);
        session.pausedTime += pausedDuration;
      }
      
      session.lastResumeTime = now;
      session.lastPauseTime = undefined;
      await session.save();
      
      // Update user status
      await User.findByIdAndUpdate(userId, {
        isPaused: false,
        lastActivity: now,
      });
      
      // Log activity
      await new ActivityLog({
        userId,
        sessionId: session._id,
        type: 'manual-resume',
        timestamp: now,
      }).save();
      
      return NextResponse.json({ success: true, message: 'Work resumed' });
    }
    
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Pause/Resume error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}