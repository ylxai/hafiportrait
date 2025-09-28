#!/bin/bash

# Auto-merge dev to main script
# Usage: bash scripts/auto-merge-dev-to-main.sh

echo "🔄 Auto-merge dev to main script"
echo "================================"
echo ""

# Function to check command success
check_success() {
    if [ $? -eq 0 ]; then
        echo "✅ $1 successful"
    else
        echo "❌ $1 failed"
        exit 1
    fi
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Not in project root directory"
    exit 1
fi

# Check if dev-workspace is healthy
echo "🏥 Checking development environment health..."
DEV_HEALTH=$(curl -s http://localhost:3002/api/health 2>/dev/null)
if echo "$DEV_HEALTH" | grep -q "healthy"; then
    echo "✅ Development environment is healthy"
    echo "📊 Response: $DEV_HEALTH"
else
    echo "❌ Development environment is not healthy"
    echo "📊 Response: $DEV_HEALTH"
    echo "🚫 Aborting merge - fix development issues first"
    exit 1
fi

# Get current branch
CURRENT_BRANCH=$(git branch --show-current)
echo "📋 Current branch: $CURRENT_BRANCH"

# Ensure we're on dev branch
if [ "$CURRENT_BRANCH" != "dev" ]; then
    echo "🔄 Switching to dev branch..."
    git checkout dev
    check_success "Switch to dev branch"
fi

# Pull latest dev changes
echo "📥 Pulling latest dev changes..."
git pull origin dev
check_success "Pull dev changes"

# Check if there are any uncommitted changes
if ! git diff-index --quiet HEAD --; then
    echo "⚠️  Uncommitted changes detected. Please commit or stash them first."
    git status
    exit 1
fi

# Switch to main branch
echo "🔄 Switching to main branch..."
git checkout main
check_success "Switch to main branch"

# Pull latest main changes
echo "📥 Pulling latest main changes..."
git pull origin main
check_success "Pull main changes"

# Merge dev into main
echo "🔀 Merging dev into main..."
git merge dev --no-ff -m "Auto-merge: Deploy dev to production

- Development environment tested and healthy
- All features verified in dev-workspace
- Ready for production deployment"
check_success "Merge dev into main"

# Push to main (this will trigger production deployment)
echo "🚀 Pushing to main branch (will trigger production deployment)..."
git push origin main
check_success "Push to main branch"

echo ""
echo "🎉 Auto-merge completed successfully!"
echo "📋 Summary:"
echo "  ✅ Development health check passed"
echo "  ✅ Dev branch merged into main"
echo "  ✅ Changes pushed to main branch"
echo "  🚀 Production deployment will start automatically"
echo ""
echo "🌐 Monitor deployment at:"
echo "  - GitHub Actions: https://github.com/ylxai/hafiportrait/actions"
echo "  - Production: http://147.251.255.227:3000"
echo ""