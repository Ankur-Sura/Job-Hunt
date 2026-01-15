#!/bin/bash

# =============================================================================
#                     SERVICE MONITOR - AUTO RESTART
# =============================================================================
# 
# This script monitors all services and automatically restarts them
# if they crash or become unresponsive.
# 
# Run this in a separate terminal or as a background process:
#   ./scripts/monitor-services.sh
# 
# =============================================================================

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Get the project root directory
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

# Create logs directory
mkdir -p "$PROJECT_ROOT/logs"

# Check interval (in seconds)
CHECK_INTERVAL=30

echo -e "${GREEN}=========================================="
echo "     SERVICE MONITOR STARTED"
echo "=========================================="
echo "Monitoring services every $CHECK_INTERVAL seconds"
echo "Press Ctrl+C to stop monitoring"
echo "==========================================${NC}"
echo ""

# Function to check if a service is healthy
check_service_health() {
    local url=$1
    local name=$2
    
    if curl -sS --connect-timeout 5 --max-time 10 "$url" > /dev/null 2>&1; then
        return 0  # Healthy
    else
        return 1  # Unhealthy
    fi
}

# Function to restart AI service
restart_ai_service() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] Restarting AI Service...${NC}"
    
    # Kill existing process
    lsof -ti:8005 | xargs kill -9 2>/dev/null || true
    sleep 2
    
    # Start new process
    cd "$PROJECT_ROOT/AI"
    source venv/bin/activate
    python main.py > "$PROJECT_ROOT/logs/ai-service.log" 2>&1 &
    cd "$PROJECT_ROOT"
    
    # Wait for it to be ready
    sleep 5
    if check_service_health "http://localhost:8005/health" "AI Service"; then
        echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] ✅ AI Service restarted successfully${NC}"
    else
        echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ❌ AI Service restart failed${NC}"
    fi
}

# Function to restart Backend
restart_backend() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] Restarting Backend...${NC}"
    
    # Kill existing process
    lsof -ti:8080 | xargs kill -9 2>/dev/null || true
    sleep 2
    
    # Start new process
    cd "$PROJECT_ROOT/backend"
    node server.js > "$PROJECT_ROOT/logs/backend.log" 2>&1 &
    cd "$PROJECT_ROOT"
    
    # Wait for it to be ready
    sleep 5
    if check_service_health "http://localhost:8080/api/health" "Backend"; then
        echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] ✅ Backend restarted successfully${NC}"
    else
        echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ❌ Backend restart failed${NC}"
    fi
}

# Main monitoring loop
while true; do
    # Check AI Service
    if ! check_service_health "http://localhost:8005/health" "AI Service"; then
        if lsof -i:8005 > /dev/null 2>&1; then
            echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ⚠️  AI Service is running but not responding${NC}"
        else
            echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ⚠️  AI Service is not running${NC}"
        fi
        restart_ai_service
    fi
    
    # Check Backend
    if ! check_service_health "http://localhost:8080/api/health" "Backend"; then
        if lsof -i:8080 > /dev/null 2>&1; then
            echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ⚠️  Backend is running but not responding${NC}"
        else
            echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ⚠️  Backend is not running${NC}"
        fi
        restart_backend
    fi
    
    # Sleep before next check
    sleep $CHECK_INTERVAL
done

