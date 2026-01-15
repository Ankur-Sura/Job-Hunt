/**
 * Script to fix recruiter roles correctly:
 * - admin@gmail.com should be 'user' (or 'admin' if it was admin)
 * - hire@gmail.com should be 'hirer'
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/jobportal';

async function fixRecruiterRoles() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Fix admin@gmail.com - should be 'user' or 'admin', NOT 'hirer'
    const admin = await User.findOne({ email: 'admin@gmail.com' });
    if (admin) {
      console.log(`✅ Found admin: ${admin.name} (${admin.email})`);
      console.log(`   Current role: ${admin.role}`);
      
      // Change back to 'user' (or keep as 'admin' if it was admin)
      // Since it was originally 'user', we'll set it back
      admin.role = 'user';
      await admin.save();
      console.log('✅ Updated admin@gmail.com role to: user');
    } else {
      console.log('⚠️  admin@gmail.com not found');
    }

    // Fix hire@gmail.com - should be 'hirer'
    const hire = await User.findOne({ email: 'hire@gmail.com' });
    if (hire) {
      console.log(`✅ Found hire: ${hire.name} (${hire.email})`);
      console.log(`   Current role: ${hire.role}`);
      
      hire.role = 'hirer';
      await hire.save();
      console.log('✅ Updated hire@gmail.com role to: hirer');
    } else {
      console.log('❌ hire@gmail.com not found');
      console.log('   Creating hire@gmail.com user...');
      
      // Create hire user if it doesn't exist
      const bcrypt = require('bcryptjs');
      const newHire = new User({
        name: 'Hire User',
        email: 'hire@gmail.com',
        password: await bcrypt.hash('hire123', 10),
        role: 'hirer',
        profile: {
          completion: 0,
          achievements: 0,
          education: 0,
          experience: 0,
          certificates: 0,
          skills: 0,
          resume: 0,
          socialMedia: 0
        },
        performance: {
          jobProfileScore: 0,
          opportunitiesApplied: 0,
          shortlisted: 0,
          rejected: 0
        },
        hasInternship: false,
        resumeId: null,
        resumeData: null
      });
      
      await newHire.save();
      console.log('✅ Created hire@gmail.com user with role: hirer');
    }
    
    console.log('\n✅ Recruiter roles fixed correctly!');
    console.log('   - admin@gmail.com: user');
    console.log('   - hire@gmail.com: hirer');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixRecruiterRoles();

