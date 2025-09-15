import mongoose from 'mongoose';

const WorkSessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  checkInTime: {
    type: Date,
    required: true,
  },
  checkOutTime: {
    type: Date,
  },
  totalActiveTime: {
    type: Number,
    default: 0, // in minutes
  },
  idleTime: {
    type: Number,
    default: 0, // in minutes
  },
  pausedTime: {
    type: Number,
    default: 0, // in minutes
  },
  activityCount: {
    type: Number,
    default: 0,
  },
  date: {
    type: String,
    required: true, // YYYY-MM-DD format
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  lastPauseTime: {
    type: Date,
  },
  lastResumeTime: {
    type: Date,
  },
}, {
  timestamps: true,
});

export default mongoose.models.WorkSession || mongoose.model('WorkSession', WorkSessionSchema);