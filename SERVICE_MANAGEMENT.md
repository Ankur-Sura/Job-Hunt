# 🛡️ Service Management & Reliability

This document explains how to ensure all services stay running and don't crash unexpectedly.

## 🚀 Quick Start

### Start All Services (Recommended)
```bash
./scripts/start-all.sh
```

### Start with Auto-Restart Monitor
```bash
# Terminal 1: Start all services
./scripts/start-all.sh

# Terminal 2: Start monitor (auto-restarts if services crash)
./scripts/monitor-services.sh
```

### Stop All Services
```bash
./scripts/stop-all.sh
```

## 🛡️ Reliability Improvements

### 1. Improved Health Checks
- **Retry Logic**: Health checks now retry up to 3 times with increasing timeouts (5s, 10s, 15s)
- **Better Error Handling**: Distinguishes between timeouts and connection errors
- **Graceful Degradation**: Services continue working even if health checks fail occasionally

### 2. Resume Upload Protection
- **Double Health Check**: Checks AI service health twice before rejecting uploads
- **Retry on Failure**: Waits 2 seconds and retries if first check fails
- **Better Error Messages**: More helpful error messages for users

### 3. Crash Prevention
- **Error Logging**: All uncaught exceptions and unhandled rejections are logged to `logs/backend-errors.log`
- **No Process Exit**: Backend continues serving requests even after errors
- **Graceful Shutdown**: Proper cleanup on shutdown signals

### 4. Automatic Monitoring
- **Health Monitoring**: Checks service health every 30 seconds
- **Auto-Restart**: Automatically restarts services if they crash or become unresponsive
- **Logging**: All restart events are logged with timestamps

## 📋 What Changed

### Backend (`backend/services/aiService.js`)
- Health check now retries 3 times with exponential backoff
- Better timeout handling (5s → 10s → 15s)
- Improved error messages

### Resume Upload (`backend/routes/resume.js`)
- Double health check before rejecting uploads
- 2-second retry delay if first check fails
- Better error messages

### Server (`backend/server.js`)
- Error logging to `logs/backend-errors.log`
- Better error handling for uncaught exceptions
- Continues serving requests after errors

### New Scripts (`scripts/`)
- `start-all.sh` - Start all services with health checks
- `stop-all.sh` - Stop all services cleanly
- `monitor-services.sh` - Auto-restart monitor

## 🔍 Monitoring

### Check Service Status
```bash
# Check if services are running
curl http://localhost:8005/health  # AI Service
curl http://localhost:8080/api/health  # Backend
```

### View Logs
```bash
# Real-time logs
tail -f logs/ai-service.log
tail -f logs/backend.log
tail -f logs/frontend.log
tail -f logs/backend-errors.log  # Error log
```

### Check Process Status
```bash
# Check what's running on each port
lsof -i :8005  # AI Service
lsof -i :8080  # Backend
lsof -i :5173  # Frontend
```

## 🎯 Best Practices

1. **Always use the scripts** instead of manually starting services
2. **Run the monitor** in a separate terminal for automatic recovery
3. **Check logs regularly** to catch issues early
4. **Stop services properly** using `stop-all.sh` before shutting down
5. **Keep monitor running** if you want automatic restarts

## 🐛 Troubleshooting

### Services keep crashing
1. Check error logs: `cat logs/backend-errors.log`
2. Check service logs: `tail -f logs/backend.log`
3. Verify dependencies are installed
4. Check environment variables are set correctly

### Health checks failing
1. Wait 10-15 seconds after starting services
2. Check if services are actually running: `lsof -i :8005`
3. Check network connectivity
4. Review service logs for errors

### Monitor not restarting
1. Check if monitor is running: `ps aux | grep monitor-services`
2. Check monitor logs if running with nohup
3. Verify script has execute permissions: `chmod +x scripts/monitor-services.sh`

## 📝 Notes

- Services may take 10-15 seconds to fully initialize
- Health checks are cached for 30 seconds to reduce load
- Monitor checks services every 30 seconds
- All logs are saved in the `logs/` directory

