#!/bin/bash

# HafiPortrait Production Rollback Script
# Usage: bash scripts/ci-cd/rollback-production.sh [method] [target]
# Methods: auto, git, backup, emergency
# Target: HEAD~1, commit-hash, backup-timestamp

set -e

# Configuration
APP_NAME="hafiportrait-app"
SOCKETIO_NAME="hafiportrait-socketio"
HEALTH_URL="http://localhost:3000/api/health"
BACKUP_DIR="/home/ubuntu/stable"
MAX_BACKUPS=5

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check health
check_health() {
    local max_attempts=10
    local attempt=1
    
    print_status "Checking application health..."
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s --max-time 10 "$HEALTH_URL" | grep -q "healthy"; then
            print_success "Application is healthy"
            return 0
        fi
        
        print_warning "Health check attempt $attempt/$max_attempts failed"
        sleep 3
        ((attempt++))
    done
    
    print_error "Health check failed after $max_attempts attempts"
    return 1
}

# Function to create backup before rollback
create_rollback_backup() {
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_name=".next.rollback.${timestamp}"
    
    if [ -d ".next" ]; then
        print_status "Creating rollback backup: $backup_name"
        cp -r .next "$backup_name"
        print_success "Rollback backup created"
    fi
}

# Function to cleanup old backups
cleanup_old_backups() {
    print_status "Cleaning up old backups (keeping last $MAX_BACKUPS)..."
    
    # Remove old .next.backup files
    ls -t .next.backup.* 2>/dev/null | tail -n +$((MAX_BACKUPS + 1)) | xargs rm -rf 2>/dev/null || true
    
    # Remove old .next.rollback files
    ls -t .next.rollback.* 2>/dev/null | tail -n +$((MAX_BACKUPS + 1)) | xargs rm -rf 2>/dev/null || true
    
    print_success "Backup cleanup completed"
}

# Function to restart PM2 services
restart_services() {
    print_status "Restarting PM2 services..."
    
    pm2 restart ecosystem.config.js --env production
    
    if [ $? -eq 0 ]; then
        print_success "PM2 services restarted successfully"
        sleep 5
        return 0
    else
        print_error "Failed to restart PM2 services"
        return 1
    fi
}

# Function to rollback using git
git_rollback() {
    local target=${1:-"HEAD~1"}
    
    print_status "Starting Git rollback to: $target"
    
    # Verify target exists
    if ! git rev-parse --verify "$target" >/dev/null 2>&1; then
        print_error "Invalid git target: $target"
        return 1
    fi
    
    # Create backup
    create_rollback_backup
    
    # Get current commit for logging
    local current_commit=$(git rev-parse HEAD)
    local target_commit=$(git rev-parse "$target")
    
    print_status "Rolling back from $current_commit to $target_commit"
    
    # Perform rollback
    git checkout "$target"
    
    if [ $? -eq 0 ]; then
        print_success "Git rollback completed"
        
        # Restart services
        if restart_services; then
            # Check health
            if check_health; then
                print_success "Git rollback successful and application is healthy"
                cleanup_old_backups
                return 0
            else
                print_error "Application unhealthy after git rollback"
                return 1
            fi
        else
            print_error "Failed to restart services after git rollback"
            return 1
        fi
    else
        print_error "Git rollback failed"
        return 1
    fi
}

# Function to rollback using backup
backup_rollback() {
    local backup_target=$1
    
    print_status "Starting backup rollback"
    
    # If no specific backup provided, use latest
    if [ -z "$backup_target" ]; then
        backup_target=$(ls -t .next.backup.* 2>/dev/null | head -1)
        if [ -z "$backup_target" ]; then
            print_error "No backup files found"
            return 1
        fi
        print_status "Using latest backup: $backup_target"
    fi
    
    # Verify backup exists
    if [ ! -d "$backup_target" ]; then
        print_error "Backup not found: $backup_target"
        return 1
    fi
    
    # Create rollback backup
    create_rollback_backup
    
    # Perform backup rollback
    print_status "Restoring from backup: $backup_target"
    rm -rf .next
    cp -r "$backup_target" .next
    
    if [ $? -eq 0 ]; then
        print_success "Backup restore completed"
        
        # Restart services
        if restart_services; then
            # Check health
            if check_health; then
                print_success "Backup rollback successful and application is healthy"
                cleanup_old_backups
                return 0
            else
                print_error "Application unhealthy after backup rollback"
                return 1
            fi
        else
            print_error "Failed to restart services after backup rollback"
            return 1
        fi
    else
        print_error "Backup restore failed"
        return 1
    fi
}

# Function for emergency rollback (fastest)
emergency_rollback() {
    print_error "EMERGENCY ROLLBACK INITIATED"
    
    # Try backup rollback first (fastest)
    local latest_backup=$(ls -t .next.backup.* 2>/dev/null | head -1)
    
    if [ -n "$latest_backup" ]; then
        print_status "Emergency: Using latest backup"
        rm -rf .next
        cp -r "$latest_backup" .next
        pm2 restart ecosystem.config.js --env production
        
        sleep 3
        if check_health; then
            print_success "Emergency rollback successful using backup"
            return 0
        fi
    fi
    
    # If backup fails, try git rollback
    print_status "Emergency: Trying git rollback"
    git checkout HEAD~1
    pm2 restart ecosystem.config.js --env production
    
    sleep 3
    if check_health; then
        print_success "Emergency rollback successful using git"
        return 0
    fi
    
    print_error "Emergency rollback failed - manual intervention required"
    return 1
}

# Function for automatic rollback (smart decision)
auto_rollback() {
    print_status "Starting automatic rollback (smart mode)"
    
    # Check if current deployment is healthy
    if check_health; then
        print_warning "Current deployment appears healthy. Are you sure you want to rollback?"
        read -p "Continue with rollback? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_status "Rollback cancelled by user"
            return 0
        fi
    fi
    
    # Try git rollback first (cleaner)
    print_status "Attempting git rollback..."
    if git_rollback "HEAD~1"; then
        return 0
    fi
    
    # If git fails, try backup
    print_status "Git rollback failed, trying backup rollback..."
    if backup_rollback; then
        return 0
    fi
    
    # If all fails, emergency
    print_error "All rollback methods failed, initiating emergency rollback"
    emergency_rollback
}

# Function to show usage
show_usage() {
    echo "HafiPortrait Production Rollback Script"
    echo "======================================"
    echo ""
    echo "Usage: $0 [method] [target]"
    echo ""
    echo "Methods:"
    echo "  auto      - Smart rollback (tries git, then backup, then emergency)"
    echo "  git       - Rollback using git (specify commit/HEAD~N)"
    echo "  backup    - Rollback using backup files"
    echo "  emergency - Fast emergency rollback (no questions asked)"
    echo ""
    echo "Examples:"
    echo "  $0 auto                    # Smart automatic rollback"
    echo "  $0 git HEAD~2              # Rollback 2 commits"
    echo "  $0 git abc123              # Rollback to specific commit"
    echo "  $0 backup                  # Use latest backup"
    echo "  $0 backup .next.backup.20250822_120000  # Use specific backup"
    echo "  $0 emergency               # Emergency rollback"
    echo ""
    echo "Available backups:"
    ls -t .next.backup.* 2>/dev/null | head -5 || echo "  No backups found"
    echo ""
    echo "Recent commits:"
    git log --oneline -5 2>/dev/null || echo "  Git log unavailable"
}

# Main execution
main() {
    local method=${1:-"auto"}
    local target=$2
    
    print_status "HafiPortrait Production Rollback Script"
    print_status "======================================="
    print_status "Method: $method"
    print_status "Target: ${target:-"auto-detect"}"
    print_status "Time: $(date)"
    echo ""
    
    # Verify we're in the right directory
    if [ ! -f "package.json" ] || [ ! -f "ecosystem.config.js" ]; then
        print_error "Not in HafiPortrait project directory"
        exit 1
    fi
    
    case $method in
        "auto")
            auto_rollback
            ;;
        "git")
            git_rollback "$target"
            ;;
        "backup")
            backup_rollback "$target"
            ;;
        "emergency")
            emergency_rollback
            ;;
        "help"|"-h"|"--help")
            show_usage
            exit 0
            ;;
        *)
            print_error "Unknown method: $method"
            echo ""
            show_usage
            exit 1
            ;;
    esac
    
    local exit_code=$?
    
    if [ $exit_code -eq 0 ]; then
        print_success "Rollback completed successfully!"
        print_status "Application URL: http://147.251.255.227:3000"
        print_status "Health check: $HEALTH_URL"
    else
        print_error "Rollback failed with exit code: $exit_code"
        print_error "Manual intervention may be required"
    fi
    
    exit $exit_code
}

# Run main function with all arguments
main "$@"