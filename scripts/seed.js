const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/timetracker';

// User Schema
const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  isCheckedIn: { type: Boolean, default: false },
  isPaused: { type: Boolean, default: false },
  lastActivity: { type: Date, default: Date.now },
  totalWorkingTime: { type: Number, default: 0 },
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model('User', UserSchema);

const seedUsers = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing users
    await User.deleteMany({});
    console.log('Cleared existing users');

    // Create seed users
    const users = [
      {
        username: 'admin',
        name: 'System Administrator',
        password: await bcrypt.hash('admin123', 12),
        role: 'admin',
      },
      {
        username: 'john.doe',
        name: 'John Doe',
        password: await bcrypt.hash('user123', 12),
        role: 'user',
        totalWorkingTime: 480, // 8 hours
      },
      {
        username: 'jane.smith',
        name: 'Jane Smith',
        password: await bcrypt.hash('user123', 12),
        role: 'user',
        isCheckedIn: true,
        totalWorkingTime: 360, // 6 hours
      },
      {
        username: 'mike.wilson',
        name: 'Mike Wilson',
        password: await bcrypt.hash('user123', 12),
        role: 'user',
        totalWorkingTime: 720, // 12 hours
        lastActivity: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      },
      {
        username: 'sarah.johnson',
        name: 'Sarah Johnson',
        password: await bcrypt.hash('user123', 12),
        role: 'user',
        isCheckedIn: true,
        totalWorkingTime: 240, // 4 hours
      },
    ];

    await User.insertMany(users);
    console.log('Seed users created successfully:');
    users.forEach(user => {
      console.log(`- ${user.name} (${user.username}) - Role: ${user.role}`);
    });

    console.log('\nDemo Credentials:');
    console.log('Admin: admin / admin123');
    console.log('Users: john.doe, jane.smith, mike.wilson, sarah.johnson / user123');

  } catch (error) {
    console.error('Seeding error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

seedUsers();