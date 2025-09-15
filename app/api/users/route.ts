import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';

export async function GET() {
  try {
    await connectDB();
    const users = await User.find({ role: 'user' }).select('-password');
    return NextResponse.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const { username, name, password } = await request.json();
    
    // Check if user already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return NextResponse.json({ error: 'Username already exists' }, { status: 400 });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // Create user
    const user = new User({
      username,
      name,
      password: hashedPassword,
      role: 'user',
    });
    
    await user.save();
    
    const userResponse = {
      _id: user._id,
      username: user.username,
      name: user.name,
      role: user.role,
      isCheckedIn: user.isCheckedIn,
      isPaused: user.isPaused,
      lastActivity: user.lastActivity,
      totalWorkingTime: user.totalWorkingTime,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
    
    return NextResponse.json(userResponse, { status: 201 });
  } catch (error) {
    console.error('Create user error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}