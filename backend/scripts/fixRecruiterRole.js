/**
 * Script to fix recruiter role for admin@gmail.com
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/jobportal';

async function fixRecruiterRole() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find admin user
    const admin = await User.findOne({ email: 'admin@gmail.com' });
    if (!admin) {
      console.error('❌ Admin user not found');
      process.exit(1);
    }

    console.log(`✅ Found admin: ${admin.name} (${admin.email})`);
    console.log(`   Current role: ${admin.role}`);

    // Update role to hirer
    admin.role = 'hirer';
    await admin.save();

    console.log('✅ Updated role to: hirer');
    console.log('\n✅ Recruiter role fixed!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixRecruiterRole();

