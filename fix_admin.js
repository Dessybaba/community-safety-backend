import dotenv from 'dotenv';
import { resolve } from 'path';
import mongoose from 'mongoose';
import User from './backend/src/models/user_model.js';

dotenv.config({ path: resolve(process.cwd(), '.env') });

const fixAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Delete all existing users with these emails
    await User.deleteOne({ email: 'admin@communitysafety.com' });
    await User.deleteOne({ email: 'moderator@communitysafety.com' });
    await User.deleteOne({ email: 'user@communitysafety.com' });
    console.log('🗑️  Deleted old users');

    // Create fresh users with correct passwords
    const admin = await User.create({
      name: 'System Admin',
      email: 'admin@communitysafety.com',
      password: 'admin123',
      role: 'admin',
      isActive: true
    });

    const moderator = await User.create({
      name: 'System Moderator',
      email: 'moderator@communitysafety.com',
      password: 'moderator123',
      role: 'moderator',
      isActive: true
    });

    const user = await User.create({
      name: 'Test User',
      email: 'user@communitysafety.com',
      password: 'user123',
      role: 'user',
      isActive: true
    });

    console.log('\n✅ All users created successfully!\n');
    console.log('📋 Login Credentials:');
    console.log('-----------------------------------');
    console.log('Admin:     admin@communitysafety.com / admin123');
    console.log('Moderator: moderator@communitysafety.com / moderator123');
    console.log('User:      user@communitysafety.com / user123');
    console.log('-----------------------------------\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

fixAdmin();