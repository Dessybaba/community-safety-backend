import dotenv from 'dotenv';
import { resolve } from 'path';
import mongoose from 'mongoose';
import User from '../models/user_model.js';

// Load environment variables
dotenv.config({
  path: resolve(process.cwd(), '.env')
});

const seedUsers = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing users (optional - comment out if you want to keep existing users)
    // await User.deleteMany({});
    // console.log('Cleared existing users');

    // Create Admin User
    const adminEmail = 'admin@communitysafety.com';
    const existingAdmin = await User.findOne({ email: adminEmail });
    
    if (!existingAdmin) {
      const admin = await User.create({
        name: 'System Admin',
        email: adminEmail,
        password: 'admin123', // Plain text - model will hash it automatically
        role: 'admin',
        isActive: true
      });
      console.log('✅ Admin user created:', {
        email: admin.email,
        role: admin.role,
        password: 'admin123' // Display for reference
      });
    } else {
      console.log('ℹ️  Admin user already exists:', adminEmail);
    }

    // Create Moderator User
    const moderatorEmail = 'moderator@communitysafety.com';
    const existingModerator = await User.findOne({ email: moderatorEmail });
    
    if (!existingModerator) {
      const moderator = await User.create({
        name: 'System Moderator',
        email: moderatorEmail,
        password: 'moderator123', // Plain text - model will hash it automatically
        role: 'moderator',
        isActive: true
      });
      console.log('✅ Moderator user created:', {
        email: moderator.email,
        role: moderator.role,
        password: 'moderator123' // Display for reference
      });
    } else {
      console.log('ℹ️  Moderator user already exists:', moderatorEmail);
    }

    // Create Test Regular User
    const testUserEmail = 'user@communitysafety.com';
    const existingTestUser = await User.findOne({ email: testUserEmail });
    
    if (!existingTestUser) {
      const testUser = await User.create({
        name: 'Test User',
        email: testUserEmail,
        password: 'user123', // Plain text - model will hash it automatically
        role: 'user',
        isActive: true
      });
      console.log('✅ Test user created:', {
        email: testUser.email,
        role: testUser.role,
        password: 'user123' // Display for reference
      });
    } else {
      console.log('ℹ️  Test user already exists:', testUserEmail);
    }

    console.log('\n📋 Summary:');
    console.log('Admin: admin@communitysafety.com / admin123');
    console.log('Moderator: moderator@communitysafety.com / moderator123');
    console.log('Test User: user@communitysafety.com / user123');
    console.log('\n✅ Seed users completed successfully!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding users:', error);
    process.exit(1);
  }
};

seedUsers();