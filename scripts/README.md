# 🚀 Service Management Scripts

This directory contains scripts to manage all services (AI, Backend, Frontend) with automatic monitoring and restart capabilities.

## 📋 Available Scripts

### 1. `start-all.sh` - Start All Services
Starts all three services (AI, Backend, Frontend) and waits for them to be ready.

**Usage:**
```bash
./scripts/start-all.sh
```

**What it does:**
- Checks if services are already running (avoids duplicates)
- Starts AI Service on port 8005
- Starts Backend on port 8080
- Starts Frontend on port 5173
- Waits for each service to be healthy before proceeding
- Creates log files in `logs/` directory

### 2. `stop-all.sh` - Stop All Services
Stops all running services cleanly.

**Usage:**
```bash
./scripts/stop-all.sh
```

**What it does:**
- Stops AI Service (port 8005)
- Stops Backend (port 8080)
- Stops Frontend (ports 5173/5174)
- Cleans up PID files

### 3. `monitor-services.sh` - Auto-Restart Monitor
Monitors all services and automatically restarts them if they crash or become unresponsive.

**Usage:**
```bash
# Run in a separate terminal (keeps running)
./scripts/monitor-services.sh
```

**What it does:**
- Checks service health every 30 seconds
- Automatically restarts services if they crash
- Logs all restart events with timestamps
- Runs continuously until you press Ctrl+C

## 🔧 Quick Start Guide

### Starting Services (Recommended)
```bash
# Start all services
./scripts/start-all.sh

# In a separate terminal, start the monitor (optional but recommended)
./scripts/monitor-services.sh
```

### Stopping Services
```bash
# Stop all services
./scripts/stop-all.sh
```

## 📁 Log Files

All service logs are saved in the `logs/` directory:
- `logs/ai-service.log` - AI Service output
- `logs/backend.log` - Backend output
- `logs/frontend.log` - Frontend output

## 🛡️ Reliability Features

### Improved Health Checks
- **Retry Logic**: Health checks now retry up to 3 times with increasing timeouts
- **Better Error Handling**: Distinguishes between timeouts and connection errors
- **Graceful Degradation**: Services continue working even if health checks fail occasionally

### Automatic Restart
- **Crash Detection**: Monitor detects when services stop responding
- **Auto-Restart**: Automatically restarts crashed services
- **Health Verification**: Verifies services are healthy after restart

### Resume Upload Protection
- **Double Health Check**: Checks AI service health twice before rejecting uploads
- **Retry on Failure**: Waits 2 seconds and retries if first check fails
- **Better Error Messages**: More helpful error messages for users

## 🔍 Troubleshooting

### Services won't start
1. Check if ports are already in use:
   ```bash
   lsof -i :8005  # AI Service
   lsof -i :8080  # Backend
   lsof -i :5173  # Frontend
   ```

2. Check log files for errors:
   ```bash
   tail -f logs/ai-service.log
   tail -f logs/backend.log
   tail -f logs/frontend.log
   ```

### Services keep crashing
1. Check if dependencies are installed:
   ```bash
   # AI Service
   cd AI && source venv/bin/activate && pip list
   
   # Backend
   cd backend && npm list
   
   # Frontend
   cd frontend && npm list
   ```

2. Check environment variables:
   ```bash
   # AI Service
   cat AI/.env
   
   # Backend
   cat backend/.env
   ```

### Monitor not restarting services
- Make sure the monitor script has execute permissions:
  ```bash
  chmod +x scripts/monitor-services.sh
  ```
- Check if the monitor is actually running:
  ```bash
  ps aux | grep monitor-services
  ```

## 📝 Notes

- **First Time Setup**: Make sure all dependencies are installed before running scripts
- **Port Conflicts**: If you have other apps using ports 8005, 8080, or 5173, change them in the scripts
- **Background Processes**: The monitor script runs in the foreground. Use `nohup` or `screen` to run it in the background:
  ```bash
  nohup ./scripts/monitor-services.sh > logs/monitor.log 2>&1 &
  ```

## 🎯 Best Practices

1. **Always use the scripts** instead of manually starting services
2. **Run the monitor** in a separate terminal for automatic recovery
3. **Check logs regularly** to catch issues early
4. **Stop services properly** using `stop-all.sh` before shutting down

