#!/bin/bash

# 🧹 Cleanup Script - Stop all monitoring processes
# Script untuk menghentikan semua proses yang berjalan

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}ℹ️  [INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}✅ [SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}⚠️  [WARNING]${NC} $1"
}

echo -e "${BLUE}🧹 Cleaning up all monitoring processes...${NC}"

# Stop Next.js development server
log_info "Stopping Next.js development server..."
pkill -f "next" 2>/dev/null && log_success "Next.js server stopped" || log_info "No Next.js server running"

# Stop automated monitoring
log_info "Stopping automated monitoring..."
pkill -f "automated-monitoring" 2>/dev/null && log_success "Monitoring service stopped" || log_info "No monitoring service running"

# Stop any node processes (be careful with this)
log_info "Stopping other node processes..."
pkill -f "node.*dev" 2>/dev/null && log_success "Node dev processes stopped" || log_info "No node dev processes running"

# Kill processes using port 3000
log_info "Freeing port 3000..."
lsof -ti:3000 | xargs kill -9 2>/dev/null && log_success "Port 3000 freed" || log_info "Port 3000 already free"

# Kill processes using port 4001 (socket.io)
log_info "Freeing port 4001..."
lsof -ti:4001 | xargs kill -9 2>/dev/null && log_success "Port 4001 freed" || log_info "Port 4001 already free"

# Clean up log files if requested
if [ "$1" = "--clean-logs" ]; then
    log_info "Cleaning up log files..."
    rm -rf logs/monitoring/*.log 2>/dev/null && log_success "Log files cleaned" || log_info "No log files to clean"
fi

echo -e "${GREEN}✅ Cleanup completed!${NC}"
echo -e "${BLUE}You can now run tests again safely.${NC}"