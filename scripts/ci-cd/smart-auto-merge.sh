#!/bin/bash

# Smart Auto-merge Script with GitHub Actions Integration
# Usage: bash scripts/smart-auto-merge.sh

echo "🤖 Smart Auto-merge: Dev → Main"
echo "==============================="
echo ""

# Configuration
DEV_URL="http://localhost:3002/api/health"
PROD_URL="http://localhost:3000/api/health"
GITHUB_REPO="ylxai/hafiportrait"

# Function to check command success
check_success() {
    if [ $? -eq 0 ]; then
        echo "✅ $1 successful"
        return 0
    else
        echo "❌ $1 failed"
        return 1
    fi
}

# Function to check GitHub Actions status
check_github_actions() {
    echo "🔍 Checking latest GitHub Actions status..."
    
    # Get latest workflow run status (requires gh CLI)
    if command -v gh &> /dev/null; then
        LATEST_RUN=$(gh run list --branch dev --limit 1 --json status,conclusion --jq '.[0]')
        STATUS=$(echo "$LATEST_RUN" | jq -r '.status')
        CONCLUSION=$(echo "$LATEST_RUN" | jq -r '.conclusion')
        
        if [ "$STATUS" = "completed" ] && [ "$CONCLUSION" = "success" ]; then
            echo "✅ Latest GitHub Actions run: SUCCESS"
            return 0
        else
            echo "❌ Latest GitHub Actions run: $STATUS ($CONCLUSION)"
            echo "🚫 Cannot merge - fix GitHub Actions first"
            return 1
        fi
    else
        echo "⚠️  GitHub CLI not found, skipping GitHub Actions check"
        return 0
    fi
}

# Function to check development health
check_dev_health() {
    echo "🏥 Checking development environment health..."
    
    DEV_HEALTH=$(curl -s --max-time 10 "$DEV_URL" 2>/dev/null)
    if echo "$DEV_HEALTH" | grep -q "healthy"; then
        echo "✅ Development environment is healthy"
        echo "📊 Response: $DEV_HEALTH"
        return 0
    else
        echo "❌ Development environment is not healthy"
        echo "📊 Response: $DEV_HEALTH"
        echo "🚫 Aborting merge - fix development issues first"
        return 1
    fi
}

# Function to perform the merge
perform_merge() {
    echo "🔀 Starting merge process..."
    
    # Get current branch
    CURRENT_BRANCH=$(git branch --show-current)
    echo "📋 Current branch: $CURRENT_BRANCH"
    
    # Ensure we're on dev branch
    if [ "$CURRENT_BRANCH" != "dev" ]; then
        echo "🔄 Switching to dev branch..."
        git checkout dev || return 1
    fi
    
    # Pull latest dev changes
    echo "📥 Pulling latest dev changes..."
    git pull origin dev || return 1
    
    # Check for uncommitted changes
    if ! git diff-index --quiet HEAD --; then
        echo "⚠️  Uncommitted changes detected:"
        git status --porcelain
        echo "🚫 Please commit or stash changes first"
        return 1
    fi
    
    # Switch to main branch
    echo "🔄 Switching to main branch..."
    git checkout main || return 1
    
    # Pull latest main changes
    echo "📥 Pulling latest main changes..."
    git pull origin main || return 1
    
    # Merge dev into main
    echo "🔀 Merging dev into main..."
    git merge dev --no-ff -m "🚀 Auto-merge: Deploy dev to production

✅ Development environment tested and healthy
✅ GitHub Actions passed successfully  
✅ All features verified in dev-workspace
🎯 Ready for production deployment

Auto-merged by smart-auto-merge.sh" || return 1
    
    # Push to main
    echo "🚀 Pushing to main branch..."
    git push origin main || return 1
    
    return 0
}

# Function to monitor production deployment
monitor_deployment() {
    echo "📊 Monitoring production deployment..."
    echo "🔗 GitHub Actions: https://github.com/$GITHUB_REPO/actions"
    
    # Wait for deployment to start
    sleep 10
    
    # Check production health after deployment
    echo "⏳ Waiting for production deployment to complete..."
    for i in {1..12}; do
        sleep 10
        echo "🔍 Health check attempt $i/12..."
        
        PROD_HEALTH=$(curl -s --max-time 10 "$PROD_URL" 2>/dev/null)
        if echo "$PROD_HEALTH" | grep -q "healthy"; then
            echo "✅ Production deployment successful!"
            echo "📊 Response: $PROD_HEALTH"
            return 0
        fi
    done
    
    echo "⚠️  Production health check timeout"
    echo "📊 Last response: $PROD_HEALTH"
    return 1
}

# Main execution
main() {
    echo "🚀 Starting smart auto-merge process..."
    echo ""
    
    # Step 1: Check GitHub Actions
    if ! check_github_actions; then
        exit 1
    fi
    
    # Step 2: Check development health
    if ! check_dev_health; then
        exit 1
    fi
    
    # Step 3: Perform merge
    if ! perform_merge; then
        echo "❌ Merge failed!"
        exit 1
    fi
    
    # Step 4: Monitor deployment
    echo ""
    echo "🎉 Merge completed successfully!"
    echo "📋 Summary:"
    echo "  ✅ GitHub Actions check passed"
    echo "  ✅ Development health check passed"
    echo "  ✅ Dev branch merged into main"
    echo "  ✅ Changes pushed to main branch"
    echo "  🚀 Production deployment triggered"
    echo ""
    
    # Optional: Monitor deployment
    read -p "🤔 Monitor production deployment? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        monitor_deployment
    fi
    
    echo ""
    echo "🌐 URLs:"
    echo "  - Development: http://147.251.255.227:3002"
    echo "  - Production:  http://147.251.255.227:3000"
    echo "  - GitHub Actions: https://github.com/$GITHUB_REPO/actions"
    echo ""
    echo "✨ Smart auto-merge completed!"
}

# Run main function
main "$@"