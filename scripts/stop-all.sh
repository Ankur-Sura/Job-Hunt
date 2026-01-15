#!/bin/bash

# =============================================================================
#                     STOP ALL SERVICES
# =============================================================================
# 
# This script stops all running services (AI, Backend, Frontend).
# 
# Usage:
#   ./scripts/stop-all.sh
# 
# =============================================================================

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Get the project root directory
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo -e "${YELLOW}Stopping all services...${NC}"
echo ""

# Stop AI Service (port 8005)
if lsof -ti:8005 > /dev/null 2>&1; then
    lsof -ti:8005 | xargs kill -9 2>/dev/null
    echo -e "${GREEN}✅ AI Service (8005) stopped${NC}"
else
    echo "   AI Service was not running"
fi

# Stop Backend (port 8080)
if lsof -ti:8080 > /dev/null 2>&1; then
    lsof -ti:8080 | xargs kill -9 2>/dev/null
    echo -e "${GREEN}✅ Backend (8080) stopped${NC}"
else
    echo "   Backend was not running"
fi

# Stop Frontend (ports 5173/5174)
if lsof -ti:5173 > /dev/null 2>&1; then
    lsof -ti:5173 | xargs kill -9 2>/dev/null
    echo -e "${GREEN}✅ Frontend (5173) stopped${NC}"
fi
if lsof -ti:5174 > /dev/null 2>&1; then
    lsof -ti:5174 | xargs kill -9 2>/dev/null
    echo -e "${GREEN}✅ Frontend (5174) stopped${NC}"
fi

# Clean up PID files
rm -f "$PROJECT_ROOT/logs/ai-service.pid"
rm -f "$PROJECT_ROOT/logs/backend.pid"
rm -f "$PROJECT_ROOT/logs/frontend.pid"

echo ""
echo -e "${GREEN}=========================================="
echo "     ALL SERVICES STOPPED"
echo "==========================================${NC}"
echo ""

