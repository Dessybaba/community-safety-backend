import dotenv from 'dotenv';
import { resolve } from 'path';
import mongoose from 'mongoose';
import User from '../models/user_model.js';
import Incident from '../models/incident_model.js';
import bcrypt from 'bcryptjs';

// Load environment variables
dotenv.config({
  path: resolve(process.cwd(), '.env')
});

const seedData = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data (optional - comment out if you want to keep existing data)
    // await User.deleteMany({ role: { $ne: 'admin' } });
    // await Incident.deleteMany({});
    // console.log('Cleared existing data');

    // Create sample users
    const users = [];
    
    const sampleUsers = [
      {
        name: 'John Doe',
        email: 'john.doe@example.com',
        password: await bcrypt.hash('password123', 10),
        role: 'user'
      },
      {
        name: 'Jane Smith',
        email: 'jane.smith@example.com',
        password: await bcrypt.hash('password123', 10),
        role: 'user'
      },
      {
        name: 'Mike Johnson',
        email: 'mike.johnson@example.com',
        password: await bcrypt.hash('password123', 10),
        role: 'user'
      }
    ];

    for (const userData of sampleUsers) {
      const existingUser = await User.findOne({ email: userData.email });
      if (!existingUser) {
        const user = await User.create(userData);
        users.push(user);
        console.log(`✅ Created user: ${user.email}`);
      } else {
        users.push(existingUser);
        console.log(`ℹ️  User already exists: ${userData.email}`);
      }
    }

    // Get admin/moderator for verification
    const admin = await User.findOne({ role: 'admin' });
    const moderator = await User.findOne({ role: 'moderator' });
    const verifier = moderator || admin;

    // Create sample incidents
    const incidents = [
      {
        type: 'fire',
        description: 'Fire outbreak at the central market. Multiple shops affected. Fire department is on the scene.',
        location: {
          type: 'Point',
          coordinates: [7.4951, 9.0579], // Abuja coordinates
          address: 'Central Market, Wuse, Abuja'
        },
        images: [],
        status: 'verified',
        reportedBy: users[0]._id,
        verifiedBy: verifier?._id,
        verifiedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
      },
      {
        type: 'road_hazard',
        description: 'Large pothole on the main road causing traffic. Needs immediate attention.',
        location: {
          type: 'Point',
          coordinates: [7.4851, 9.0479],
          address: 'Main Road, Garki, Abuja'
        },
        images: [],
        status: 'verified',
        reportedBy: users[1]._id,
        verifiedBy: verifier?._id,
        verifiedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) // 1 day ago
      },
      {
        type: 'theft',
        description: 'Multiple reports of phone snatching in this area. Please be cautious.',
        location: {
          type: 'Point',
          coordinates: [7.5051, 9.0679],
          address: 'Maitama District, Abuja'
        },
        images: [],
        status: 'reported',
        reportedBy: users[0]._id
      },
      {
        type: 'flooding',
        description: 'Heavy flooding after rainfall. Road is impassable. Water level is rising.',
        location: {
          type: 'Point',
          coordinates: [7.4751, 9.0379],
          address: 'Wuse 2, Abuja'
        },
        images: [],
        status: 'verified',
        reportedBy: users[2]._id,
        verifiedBy: verifier?._id,
        verifiedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) // 3 days ago
      },
      {
        type: 'power_outage',
        description: 'Power outage affecting the entire neighborhood. No electricity for 6 hours now.',
        location: {
          type: 'Point',
          coordinates: [7.5151, 9.0779],
          address: 'Asokoro, Abuja'
        },
        images: [],
        status: 'resolved',
        reportedBy: users[1]._id,
        verifiedBy: verifier?._id,
        verifiedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        resolvedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000) // 4 days ago
      },
      {
        type: 'other',
        description: 'Suspicious activity reported. Multiple individuals loitering around the area.',
        location: {
          type: 'Point',
          coordinates: [7.4651, 9.0279],
          address: 'Gwarinpa, Abuja'
        },
        images: [],
        status: 'reported',
        reportedBy: users[2]._id
      },
      {
        type: 'road_hazard',
        description: 'Broken traffic light at intersection. Creating confusion and potential accidents.',
        location: {
          type: 'Point',
          coordinates: [7.5251, 9.0879],
          address: 'Jabi, Abuja'
        },
        images: [],
        status: 'verified',
        reportedBy: users[0]._id,
        verifiedBy: verifier?._id,
        verifiedAt: new Date(Date.now() - 6 * 60 * 60 * 1000) // 6 hours ago
      },
      {
        type: 'fire',
        description: 'Small fire at a restaurant. Fire department has been notified.',
        location: {
          type: 'Point',
          coordinates: [7.4551, 9.0179],
          address: 'Utako, Abuja'
        },
        images: [],
        status: 'rejected',
        reportedBy: users[1]._id,
        verifiedBy: verifier?._id,
        verifiedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        rejectionReason: 'False alarm. Situation was already under control.'
      }
    ];

    let createdCount = 0;
    for (const incidentData of incidents) {
      const incident = await Incident.create(incidentData);
      createdCount++;
      console.log(`✅ Created incident: ${incident.type} - ${incident.status}`);
    }

    console.log(`\n📊 Summary:`);
    console.log(`- Users: ${users.length} sample users`);
    console.log(`- Incidents: ${createdCount} incidents created`);
    console.log(`\n✅ Seed data completed successfully!`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    process.exit(1);
  }
};

seedData();

