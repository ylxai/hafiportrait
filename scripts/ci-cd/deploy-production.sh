#!/bin/bash

# Production Deployment Script for HafiPortrait
# Usage: bash scripts/deploy-production.sh [branch]

BRANCH=${1:-main}
APP_NAME="hafiportrait-app"
SOCKETIO_NAME="hafiportrait-socketio"

echo "🚀 Starting production deployment..."
echo "📋 Branch: $BRANCH"
echo "📁 Directory: $(pwd)"
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

# 1. Backup current deployment
echo "💾 Creating backup..."
if [ -d ".next" ]; then
    cp -r .next .next.backup.$(date +%Y%m%d_%H%M%S)
    check_success "Backup creation"
fi

# 2. Pull latest code
echo "📥 Pulling latest code from $BRANCH..."
git fetch origin
git checkout $BRANCH
git pull origin $BRANCH
check_success "Git pull"

# 3. Setup Node.js environment via NVM
echo "🔧 Setting up Node.js environment..."

# Load NVM if available
if [ -f "$HOME/.nvm/nvm.sh" ]; then
    echo "📦 Loading NVM..."
    source "$HOME/.nvm/nvm.sh"
    source "$HOME/.nvm/bash_completion" 2>/dev/null || true
    
    # Use Node.js (try v20 first, then latest)
    nvm use 20 2>/dev/null || nvm use node 2>/dev/null || nvm use default 2>/dev/null || true
    
    echo "✅ Node.js version: $(node --version)"
    echo "✅ npm version: $(npm --version)"
    
    # Check if pnpm is available
    if command -v pnpm &> /dev/null; then
        echo "✅ pnpm version: $(pnpm --version)"
    else
        echo "📥 Installing pnpm via npm..."
        npm install -g pnpm
        check_success "pnpm installation"
    fi
else
    echo "⚠️  NVM not found, trying direct paths..."
    # Add common Node.js paths
    export PATH="/home/ubuntu/.nvm/versions/node/v22.18.0/bin:$PATH"
    export PATH="/usr/local/bin:$PATH"
    
    if command -v node &> /dev/null; then
        echo "✅ Node.js found: $(node --version)"
    else
        echo "❌ Node.js not found in PATH"
        exit 1
    fi
fi

# 4. Install dependencies if package.json changed
echo "📦 Checking dependencies..."
if git diff HEAD~1 --name-only | grep -q "package.json\|pnpm-lock.yaml"; then
    echo "📦 Dependencies changed, installing..."
    pnpm install --frozen-lockfile
    check_success "Dependencies installation"
else
    echo "📦 No dependency changes, skipping install"
fi

# 5. Build application
echo "🔨 Building application..."
rm -rf .next
pnpm build
check_success "Application build"

# 6. Restart PM2 applications
echo "🔄 Restarting PM2 applications..."
pm2 restart $APP_NAME --env production
check_success "PM2 app restart"

pm2 restart $SOCKETIO_NAME --env production
check_success "PM2 socketio restart"

# 7. Wait for applications to start
echo "⏳ Waiting for applications to start..."
sleep 5

# 7. Health check
echo "🏥 Performing health check..."
HEALTH_RESPONSE=$(curl -s http://localhost:3000/api/health)
if echo "$HEALTH_RESPONSE" | grep -q "healthy"; then
    echo "✅ Health check passed"
    echo "📊 Response: $HEALTH_RESPONSE"
else
    echo "❌ Health check failed"
    echo "📊 Response: $HEALTH_RESPONSE"
    exit 1
fi

# 8. Cleanup old backups (keep last 3)
echo "🧹 Cleaning up old backups..."
ls -t .next.backup.* 2>/dev/null | tail -n +4 | xargs rm -rf 2>/dev/null || true

echo ""
echo "🎉 Production deployment completed successfully!"
echo "🌐 Application is running at: http://localhost:3000"
echo "📊 Health status: $(echo $HEALTH_RESPONSE | jq -r .status 2>/dev/null || echo 'healthy')"
echo ""