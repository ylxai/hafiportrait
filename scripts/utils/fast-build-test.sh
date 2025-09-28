#!/bin/bash

# ================================
# FAST BUILD TEST - OPTIMIZED
# Quick test dengan build optimizations
# ================================

echo "⚡ FAST BUILD TEST - OPTIMIZED"
echo "=============================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Stop current build if running
print_status "🛑 Stopping any running builds..."
sudo docker stop $(sudo docker ps -q) 2>/dev/null || true

# Test optimized development build
echo ""
print_status "⚡ Testing OPTIMIZED Dockerfile.development..."
echo "   (User creation moved before COPY to avoid slow chown)"

start_time=$(date +%s)
if sudo docker build -f Dockerfile.development -t hafiportrait-dev-fast:latest .; then
    end_time=$(date +%s)
    build_time=$((end_time - start_time))
    print_success "✅ OPTIMIZED Development build: SUCCESS in ${build_time}s"
else
    print_error "❌ OPTIMIZED Development build: FAILED"
    exit 1
fi

# Test optimized production build
echo ""
print_status "⚡ Testing OPTIMIZED Dockerfile.production..."
echo "   (All COPY commands use --chown to avoid slow chown)"

start_time=$(date +%s)
if sudo docker build -f Dockerfile.production -t hafiportrait-prod-fast:latest .; then
    end_time=$(date +%s)
    build_time=$((end_time - start_time))
    print_success "✅ OPTIMIZED Production build: SUCCESS in ${build_time}s"
else
    print_error "❌ OPTIMIZED Production build: FAILED"
    exit 1
fi

# Test optimized socketio build
echo ""
print_status "⚡ Testing OPTIMIZED Dockerfile.socketio..."

start_time=$(date +%s)
if sudo docker build -f Dockerfile.socketio -t socketio-prod-fast:latest .; then
    end_time=$(date +%s)
    build_time=$((end_time - start_time))
    print_success "✅ OPTIMIZED Socket.IO build: SUCCESS in ${build_time}s"
else
    print_error "❌ OPTIMIZED Socket.IO build: FAILED"
    exit 1
fi

# Quick container test
echo ""
print_status "🚀 Quick container startup test..."

# Test development container
if sudo docker run -d --name test-dev-fast -p 3012:3002 hafiportrait-dev-fast:latest; then
    sleep 10
    if sudo docker ps | grep -q "test-dev-fast"; then
        print_success "✅ OPTIMIZED Development container: RUNNING"
        sudo docker stop test-dev-fast && sudo docker rm test-dev-fast
    else
        print_error "❌ OPTIMIZED Development container: FAILED"
        sudo docker logs test-dev-fast
        sudo docker rm test-dev-fast 2>/dev/null
    fi
else
    print_error "❌ OPTIMIZED Development container: FAILED TO START"
fi

echo ""
print_success "🎉 OPTIMIZED BUILD TEST COMPLETED!"
echo ""
print_status "📊 Build time improvements:"
echo "   - User creation moved before COPY (no more slow chown)"
echo "   - All COPY commands use --chown flag"
echo "   - Reduced build layers and operations"

echo ""
print_status "🔄 To use optimized builds in docker-compose:"
echo "   sudo docker-compose build --no-cache"
echo "   sudo docker-compose up hafiportrait-dev"