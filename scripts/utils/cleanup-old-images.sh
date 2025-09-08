#!/bin/bash

# ================================
# CLEANUP OLD DOCKER IMAGES
# Remove failed/old images before testing
# ================================

echo "🧹 CLEANING UP OLD DOCKER IMAGES"
echo "================================"

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

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Show current images
print_status "Current Docker images:"
sudo docker images | grep -E "(hafiportrait|socketio|stable)" || echo "No matching images found"

echo ""
print_status "Removing old/failed images..."

# Remove specific old images
sudo docker rmi stable_socketio-prod 2>/dev/null && print_success "✅ Removed stable_socketio-prod" || print_warning "⚠️ stable_socketio-prod not found or in use"
sudo docker rmi stable_hafiportrait-dev 2>/dev/null && print_success "✅ Removed stable_hafiportrait-dev" || print_warning "⚠️ stable_hafiportrait-dev not found or in use"

# Remove any dangling images
print_status "Removing dangling images..."
sudo docker image prune -f

echo ""
print_status "Images after cleanup:"
sudo docker images | grep -E "(hafiportrait|socketio)" || echo "No matching images found"

echo ""
print_success "🎉 Cleanup completed!"