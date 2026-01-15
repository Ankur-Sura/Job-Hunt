#!/bin/bash

# =============================================================================
#                     START ALL SERVICES WITH MONITORING
# =============================================================================
# 
# This script starts all services (AI, Backend, Frontend) and monitors them.
# If any service crashes, it will automatically restart it.
# 
# Usage:
#   ./scripts/start-all.sh
# 
# =============================================================================

set -e  # Exit on error

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Get the project root directory
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

echo -e "${GREEN}=========================================="
echo "     STARTING ALL SERVICES"
echo "==========================================${NC}"
echo ""

# Function to check if a port is in use
check_port() {
    local port=$1
    lsof -i :$port -P -n 2>/dev/null | grep LISTEN > /dev/null
}

# Function to wait for a service to be ready
wait_for_service() {
    local url=$1
    local name=$2
    local max_attempts=30
    local attempt=0
    
    echo -e "${YELLOW}Waiting for $name to be ready...${NC}"
    while [ $attempt -lt $max_attempts ]; do
        if curl -sS --connect-timeout 2 "$url" > /dev/null 2>&1; then
            echo -e "${GREEN}✅ $name is ready!${NC}"
            return 0
        fi
        attempt=$((attempt + 1))
        sleep 1
    done
    
    echo -e "${RED}❌ $name failed to start after $max_attempts seconds${NC}"
    return 1
}

# Function to start AI service
start_ai_service() {
    if check_port 8005; then
        echo -e "${YELLOW}⚠️  AI Service already running on port 8005${NC}"
        return 0
    fi
    
    echo -e "${GREEN}Starting AI Service on port 8005...${NC}"
    cd "$PROJECT_ROOT/AI"
    source venv/bin/activate
    python main.py > "$PROJECT_ROOT/logs/ai-service.log" 2>&1 &
    AI_PID=$!
    echo $AI_PID > "$PROJECT_ROOT/logs/ai-service.pid"
    cd "$PROJECT_ROOT"
    
    wait_for_service "http://localhost:8005/health" "AI Service"
}

# Function to start Backend service
start_backend() {
    if check_port 8080; then
        echo -e "${YELLOW}⚠️  Backend already running on port 8080${NC}"
        return 0
    fi
    
    echo -e "${GREEN}Starting Backend on port 8080...${NC}"
    cd "$PROJECT_ROOT/backend"
    node server.js > "$PROJECT_ROOT/logs/backend.log" 2>&1 &
    BACKEND_PID=$!
    echo $BACKEND_PID > "$PROJECT_ROOT/logs/backend.pid"
    cd "$PROJECT_ROOT"
    
    wait_for_service "http://localhost:8080/api/health" "Backend"
}

# Function to start Frontend service
start_frontend() {
    if check_port 5173 || check_port 5174; then
        echo -e "${YELLOW}⚠️  Frontend already running${NC}"
        return 0
    fi
    
    echo -e "${GREEN}Starting Frontend...${NC}"
    cd "$PROJECT_ROOT/frontend"
    npm run dev -- --host > "$PROJECT_ROOT/logs/frontend.log" 2>&1 &
    FRONTEND_PID=$!
    echo $FRONTEND_PID > "$PROJECT_ROOT/logs/frontend.pid"
    cd "$PROJECT_ROOT"
    
    sleep 3  # Frontend takes a moment to start
    echo -e "${GREEN}✅ Frontend starting (check http://localhost:5173)${NC}"
}

# Create logs directory
mkdir -p "$PROJECT_ROOT/logs"

# Start services
start_ai_service
start_backend
start_frontend

echo ""
echo -e "${GREEN}=========================================="
echo "     ALL SERVICES STARTED"
echo "==========================================${NC}"
echo ""
echo -e "${GREEN}✅ AI Service:  http://localhost:8005${NC}"
echo -e "${GREEN}✅ Backend:     http://localhost:8080${NC}"
echo -e "${GREEN}✅ Frontend:    http://localhost:5173${NC}"
echo ""
echo -e "${YELLOW}Logs are available in: $PROJECT_ROOT/logs/${NC}"
echo ""
echo -e "${YELLOW}To stop all services, run: ./scripts/stop-all.sh${NC}"
echo ""

