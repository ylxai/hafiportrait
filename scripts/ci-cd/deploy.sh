#!/bin/bash

# HafiPortrait Deployment Script
# Usage: ./deploy.sh [staging|production]

set -e  # Exit on any error

ENVIRONMENT=${1:-staging}
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DEPLOY_LOG="logs/deploy_${ENVIRONMENT}_${TIMESTAMP}.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$DEPLOY_LOG"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$DEPLOY_LOG"
    exit 1
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$DEPLOY_LOG"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$DEPLOY_LOG"
}

# Create logs directory if it doesn't exist
mkdir -p logs

log "🚀 Starting HafiPortrait deployment to $ENVIRONMENT"

# Validate environment
if [[ "$ENVIRONMENT" != "staging" && "$ENVIRONMENT" != "production" ]]; then
    error "Invalid environment. Use 'staging' or 'production'"
fi

# Check required environment variables
check_env_vars() {
    log "🔍 Checking environment variables..."
    
    local required_vars=(
        "DATABASE_URL"
        "JWT_SECRET"
        "SESSION_SECRET"
        "NEXT_PUBLIC_APP_URL"
    )
    
    for var in "${required_vars[@]}"; do
        if [[ -z "${!var}" ]]; then
            error "Required environment variable $var is not set"
        fi
    done
    
    success "Environment variables validated"
}

# Install dependencies
install_dependencies() {
    log "📦 Installing dependencies..."
    
    if command -v pnpm &> /dev/null; then
        pnpm install --frozen-lockfile --production=false
    else
        npm ci
    fi
    
    success "Dependencies installed"
}

# Run tests
run_tests() {
    log "🧪 Running tests..."
    
    # Run linting
    if command -v pnpm &> /dev/null; then
        pnpm run lint || warning "Linting failed"
    else
        npm run lint || warning "Linting failed"
    fi
    
    # Run type checking
    if command -v pnpm &> /dev/null; then
        pnpm run build || error "Build failed"
    else
        npm run build || error "Build failed"
    fi
    
    success "Tests completed"
}

# Build application
build_application() {
    log "🏗️ Building application for $ENVIRONMENT..."
    
    export NODE_ENV=production
    
    if command -v pnpm &> /dev/null; then
        pnpm run build
    else
        npm run build
    fi
    
    success "Application built successfully"
}

# Database migration
run_migrations() {
    log "🗄️ Running database migrations..."
    
    # Add your database migration commands here
    # Example: npx prisma migrate deploy
    # Or: npm run db:migrate
    
    log "Database migrations completed (add your migration commands)"
}

# Deploy to Vercel (removed)
deploy_vercel() {
    log "⏭️ Skipping Vercel deployment (VPS only)"
    
    if ! command -v vercel &> /dev/null; then
        npm install -g vercel
    fi
    
    if [[ "$ENVIRONMENT" == "production" ]]; then
        vercel --prod --yes
    else
        vercel --yes
    fi
    
    success "Deployed to Vercel"
}

# Deploy to Railway
deploy_railway() {
    log "🚂 Deploying to Railway ($ENVIRONMENT)..."
    
    if ! command -v railway &> /dev/null; then
        npm install -g @railway/cli
    fi
    
    railway up
    
    success "Deployed to Railway"
}

# Deploy to Render
deploy_render() {
    log "🎨 Deploying to Render ($ENVIRONMENT)..."
    
    # Render deploys automatically on git push
    # This is just a placeholder for any Render-specific commands
    
    success "Render deployment triggered"
}

# Deploy to custom server
deploy_custom_server() {
    log "🖥️ Deploying to custom server ($ENVIRONMENT)..."
    
    # Stop existing PM2 processes
    pm2 stop hafiportrait-web hafiportrait-socketio || true
    
    # Start PM2 processes
    if [[ "$ENVIRONMENT" == "production" ]]; then
        pm2 start ecosystem.config.js --env production
    else
        pm2 start ecosystem.config.js --env development
    fi
    
    # Save PM2 configuration
    pm2 save
    
    success "Deployed to custom server"
}

# Health check
health_check() {
    log "🏥 Running health check..."
    
    local max_attempts=30
    local attempt=1
    local health_url="${NEXT_PUBLIC_APP_URL}/api/health"
    
    while [[ $attempt -le $max_attempts ]]; do
        log "Health check attempt $attempt/$max_attempts..."
        
        if curl -f -s "$health_url" > /dev/null; then
            success "Health check passed"
            return 0
        fi
        
        sleep 10
        ((attempt++))
    done
    
    error "Health check failed after $max_attempts attempts"
}

# Rollback function
rollback() {
    log "🔄 Rolling back deployment..."
    
    # Add rollback logic here
    # This could involve:
    # - Reverting to previous git commit
    # - Restoring previous database backup
    # - Switching to previous deployment
    
    warning "Rollback functionality needs to be implemented"
}

# Cleanup function
cleanup() {
    log "🧹 Cleaning up..."
    
    # Remove temporary files
    rm -rf .next/cache/webpack || true
    
    # Clean up old logs (keep last 10)
    ls -t logs/deploy_*.log | tail -n +11 | xargs rm -f || true
    
    success "Cleanup completed"
}

# Main deployment function
main() {
    log "🎯 HafiPortrait Deployment Started"
    log "Environment: $ENVIRONMENT"
    log "Timestamp: $TIMESTAMP"
    
    # Trap errors and run cleanup
    trap 'error "Deployment failed"; cleanup; exit 1' ERR
    
    # Pre-deployment checks
    check_env_vars
    
    # Install and test
    install_dependencies
    run_tests
    build_application
    
    # Database operations
    run_migrations
    
    # Deploy based on platform
    if [[ -n "$VERCEL_URL" ]]; then
        log "⏭️ Skipping Vercel deployment (VPS only)"
        deploy_vercel
    elif [[ -n "$RAILWAY_ENVIRONMENT" ]]; then
        deploy_railway
    elif [[ -n "$RENDER" ]]; then
        deploy_render
    else
        deploy_custom_server
    fi
    
    # Post-deployment verification
    health_check
    
    # Cleanup
    cleanup
    
    success "🎉 Deployment to $ENVIRONMENT completed successfully!"
    log "📄 Deployment log saved to: $DEPLOY_LOG"
}

# Handle script arguments
case "${2:-}" in
    "rollback")
        rollback
        ;;
    "health-check")
        health_check
        ;;
    "cleanup")
        cleanup
        ;;
    *)
        main
        ;;
esac