#!/bin/bash

# ================================
# QUICK DOCKER TEST
# Fast test for all optimized images
# ================================

echo "⚡ QUICK DOCKER TEST"
echo "==================="

# Test builds only (no container startup)
echo ""
echo "🔨 Testing Dockerfile.development..."
if sudo docker build -f Dockerfile.development -t hafiportrait-dev:latest . > /dev/null 2>&1; then
    echo "✅ Development build: SUCCESS"
else
    echo "❌ Development build: FAILED"
    exit 1
fi

echo ""
echo "🏭 Testing Dockerfile.production..."
if sudo docker build -f Dockerfile.production -t hafiportrait-prod:latest . > /dev/null 2>&1; then
    echo "✅ Production build: SUCCESS"
else
    echo "❌ Production build: FAILED"
    exit 1
fi

echo ""
echo "🔌 Testing Dockerfile.socketio..."
if sudo docker build -f Dockerfile.socketio -t socketio-prod:latest . > /dev/null 2>&1; then
    echo "✅ Socket.IO build: SUCCESS"
else
    echo "❌ Socket.IO build: FAILED"
    exit 1
fi

echo ""
echo "🐳 Testing docker-compose..."
if sudo docker-compose build > /dev/null 2>&1; then
    echo "✅ Docker-compose build: SUCCESS"
else
    echo "❌ Docker-compose build: FAILED"
    exit 1
fi

echo ""
echo "📊 Image sizes:"
sudo docker images | grep -E "(hafiportrait|socketio)" | head -5

echo ""
echo "🎉 ALL BUILDS SUCCESSFUL!"
echo "Ready for deployment!"