#!/bin/bash

# ================================
# TEST NEW OPTIMIZED IMAGES ONLY
# Keep existing stable_hafiportrait-dev running
# ================================

echo "🧪 TESTING NEW OPTIMIZED IMAGES"
echo "================================"
echo "ℹ️  Keeping stable_hafiportrait-dev running..."

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

# 1. Remove only failed socketio image
echo ""
print_status "🧹 Removing failed stable_socketio-prod..."
sudo docker rmi stable_socketio-prod 2>/dev/null && print_success "✅ Removed stable_socketio-prod" || print_status "ℹ️  stable_socketio-prod not found"

# 2. Setup volumes
echo ""
print_status "📁 Setting up volumes..."
sudo ./scripts/docker/setup-docker-volumes.sh

# 3. Test new production dockerfile
echo ""
print_status "🏭 Testing NEW Dockerfile.production..."
if sudo docker build -f Dockerfile.production -t hafiportrait-prod-new:latest .; then
    print_success "✅ NEW Production build: SUCCESS"
else
    print_error "❌ NEW Production build: FAILED"
    exit 1
fi

# 4. Test new socketio dockerfile
echo ""
print_status "🔌 Testing NEW Dockerfile.socketio..."
if sudo docker build -f Dockerfile.socketio -t socketio-prod-new:latest .; then
    print_success "✅ NEW Socket.IO build: SUCCESS"
else
    print_error "❌ NEW Socket.IO build: FAILED"
    exit 1
fi

# 5. Test new development dockerfile (different tag to avoid conflict)
echo ""
print_status "🔨 Testing NEW Dockerfile.development..."
if sudo docker build -f Dockerfile.development -t hafiportrait-dev-new:latest .; then
    print_success "✅ NEW Development build: SUCCESS"
else
    print_error "❌ NEW Development build: FAILED"
    exit 1
fi

# 6. Quick container test for new production images
echo ""
print_status "🚀 Quick test new production containers..."

# Test new socketio first
print_status "Testing new Socket.IO container..."
if sudo docker run -d --name test-socketio-new -p 3011:3001 socketio-prod-new:latest; then
    sleep 5
    if sudo docker ps | grep -q "test-socketio-new"; then
        print_success "✅ NEW Socket.IO container: RUNNING"
        sudo docker stop test-socketio-new && sudo docker rm test-socketio-new
    else
        print_error "❌ NEW Socket.IO container: FAILED"
        sudo docker logs test-socketio-new
        sudo docker rm test-socketio-new 2>/dev/null
        exit 1
    fi
else
    print_error "❌ NEW Socket.IO container: FAILED TO START"
    exit 1
fi

# Test new production app
print_status "Testing new production container..."
if sudo docker run -d --name test-prod-new -p 3010:3000 hafiportrait-prod-new:latest; then
    sleep 10
    if sudo docker ps | grep -q "test-prod-new"; then
        print_success "✅ NEW Production container: RUNNING"
        sudo docker stop test-prod-new && sudo docker rm test-prod-new
    else
        print_error "❌ NEW Production container: FAILED"
        sudo docker logs test-prod-new
        sudo docker rm test-prod-new 2>/dev/null
        exit 1
    fi
else
    print_error "❌ NEW Production container: FAILED TO START"
    exit 1
fi

# 7. Show image comparison
echo ""
print_status "📊 Image comparison:"
echo "OLD vs NEW images:"
sudo docker images | grep -E "(stable_hafiportrait|hafiportrait.*new|socketio.*new)" | sort

echo ""
print_success "🎉 ALL NEW IMAGES TESTED SUCCESSFULLY!"
echo ""
print_status "🔄 Next steps:"
echo "  1. Stop old production if running: sudo docker-compose down"
echo "  2. Update docker-compose.yml to use new images"
echo "  3. Start new production: sudo docker-compose up hafiportrait-prod"
echo ""
print_status "✅ Your stable_hafiportrait-dev is still running normally"