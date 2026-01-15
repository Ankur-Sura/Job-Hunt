# Database Initialization - Smart Stay Pattern

This folder follows the same initialization pattern as the Smart Stay project.

## Files

- **`data.js`** - Contains all sample job data (200 jobs total)
- **`index.js`** - Database initialization script

## How to Use

### Prerequisites
Make sure you have installed backend dependencies:
```bash
cd backend
npm install
```

### Run Initialization
```bash
cd backend
node init/index.js
```

This will:
1. ✅ Connect to MongoDB (jobportal database)
2. 🗑️  Delete all existing jobs
3. ✅ Insert 200 sample jobs from `data.js`
4. 🔌 Close connection and exit

## What Gets Seeded

- **10 detailed jobs** from major companies (Icertis, Amazon, Microsoft, Google, etc.)
- **190 generated jobs** with full descriptions, skills, and qualifications
- **Total: 200 jobs** ready for AI processing and job matching

## Data Structure

Each job includes:
- Company name and details
- Job title and location
- Detailed description (for AI processing)
- Skills array
- Salary information
- Experience requirements
- Qualifications (basic and preferred)
- Application dates
- Job type and mode

## Notes

- ⚠️ **Warning**: This will DELETE all existing jobs!
- The script uses mongoose to connect to MongoDB
- Follows the exact same pattern as Smart Stay's `init/index.js`
- All jobs have detailed descriptions suitable for AI-powered matching

