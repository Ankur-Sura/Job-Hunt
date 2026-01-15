# Quick Start Guide - Job Portal

## ✅ All Services Status

### Services Running:
- ✅ MongoDB: Port 27017
- ✅ Qdrant: Port 6333  
- ✅ AI Service: Port 8001
- ✅ Backend: Port 8080
- ✅ Frontend: Port 5173

## 🚀 Start All Services

### 1. Install Frontend Dependencies
```bash
cd frontend
npm install
```

### 2. Install Tailwind CSS (if not installed)
```bash
cd frontend
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

### 3. Start Services

**Terminal 1 - Backend:**
```bash
cd backend
npm install
npm start
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

**Terminal 3 - AI Service:**
```bash
cd AI
python main.py
```

## 🌐 Access Website

**Landing Page:** http://localhost:5173
- Modern landing page with "engineer HUB" branding
- Login button in header
- "Join the waitlist" call-to-action
- Profile cards showing users, companies, clubs

**Login:** http://localhost:5173/login
**Register:** http://localhost:5173/register
**Dashboard:** http://localhost:5173/dashboard (after login)
**Jobs:** http://localhost:5173/jobs

## 🎨 UI Features

- ✅ Modern Tailwind CSS design
- ✅ Smooth animations with Framer Motion
- ✅ Responsive layout
- ✅ Clean, professional interface
- ✅ Login option in header
- ✅ Landing page matching design requirements

## 📝 Next Steps

1. **Seed Jobs Database:**
   ```bash
   cd backend
   node scripts/seedJobs.js
   ```

2. **Test the Flow:**
   - Register a new account
   - Upload resume (PDF)
   - Browse jobs with AI recommendations
   - Apply to jobs
   - Get interview preparation

## 🔧 Troubleshooting

If Tailwind CSS styles aren't showing:
```bash
cd frontend
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
# Restart dev server
```

If services aren't running:
- Check ports: 5173, 8080, 8001, 6333, 27017
- Check logs for errors
- Verify .env files are configured

