import mongoose from 'mongoose';

const ActivityLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WorkSession',
  },
  type: {
    type: String,
    enum: ['check-in', 'check-out', 'activity', 'idle-start', 'idle-end', 'manual-pause', 'manual-resume'],
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
  },
}, {
  timestamps: true,
});

export default mongoose.models.ActivityLog || mongoose.model('ActivityLog', ActivityLogSchema);