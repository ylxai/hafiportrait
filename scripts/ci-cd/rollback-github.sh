#!/bin/bash

# GitHub-based Rollback Script
# Usage: bash scripts/ci-cd/rollback-github.sh [commit-hash|HEAD~N]

set -e

# Configuration
GITHUB_REPO="ylxai/hafiportrait"
BRANCH="main"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to perform git revert and push
github_rollback() {
    local target=${1:-"HEAD"}
    
    print_status "Starting GitHub-based rollback"
    print_status "Target: $target"
    
    # Verify target exists
    if ! git rev-parse --verify "$target" >/dev/null 2>&1; then
        print_error "Invalid git target: $target"
        return 1
    fi
    
    # Get commit info
    local target_commit=$(git rev-parse "$target")
    local target_message=$(git log --format="%s" -n 1 "$target")
    
    print_status "Rolling back commit: $target_commit"
    print_status "Commit message: $target_message"
    
    # Confirm rollback
    echo ""
    print_status "This will:"
    echo "  1. Create a revert commit"
    echo "  2. Push to GitHub main branch"
    echo "  3. Trigger GitHub Actions deployment"
    echo "  4. Deploy the reverted version to production"
    echo ""
    
    read -p "Continue with GitHub rollback? (y/N): " -n 1 -r
    echo ""
    
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_status "Rollback cancelled by user"
        return 0
    fi
    
    # Perform revert
    print_status "Creating revert commit..."
    
    if git revert "$target" --no-edit; then
        print_success "Revert commit created"
        
        # Push to GitHub
        print_status "Pushing to GitHub..."
        
        if git push origin "$BRANCH"; then
            print_success "Pushed to GitHub successfully"
            print_status "GitHub Actions deployment will start automatically"
            print_status "Monitor at: https://github.com/$GITHUB_REPO/actions"
            
            # Wait and monitor deployment
            monitor_github_deployment
            
        else
            print_error "Failed to push to GitHub"
            return 1
        fi
    else
        print_error "Failed to create revert commit"
        print_error "There might be conflicts that need manual resolution"
        return 1
    fi
}

# Function to monitor GitHub Actions deployment
monitor_github_deployment() {
    print_status "Monitoring GitHub Actions deployment..."
    
    if command -v gh &> /dev/null; then
        print_status "Using GitHub CLI to monitor deployment"
        
        # Wait for workflow to start
        sleep 10
        
        # Monitor latest workflow run
        local max_wait=600  # 10 minutes
        local waited=0
        
        while [ $waited -lt $max_wait ]; do
            local status=$(gh run list --branch "$BRANCH" --limit 1 --json status,conclusion --jq '.[0].status')
            local conclusion=$(gh run list --branch "$BRANCH" --limit 1 --json status,conclusion --jq '.[0].conclusion')
            
            if [ "$status" = "completed" ]; then
                if [ "$conclusion" = "success" ]; then
                    print_success "GitHub Actions deployment completed successfully!"
                    print_status "Production rollback is now live"
                    return 0
                else
                    print_error "GitHub Actions deployment failed: $conclusion"
                    return 1
                fi
            fi
            
            print_status "Deployment in progress... ($waited/$max_wait seconds)"
            sleep 30
            waited=$((waited + 30))
        done
        
        print_error "Deployment monitoring timeout"
        print_status "Check manually at: https://github.com/$GITHUB_REPO/actions"
        
    else
        print_status "GitHub CLI not available, manual monitoring required"
        print_status "Monitor deployment at: https://github.com/$GITHUB_REPO/actions"
        print_status "Expected deployment time: 5-10 minutes"
    fi
}

# Function to show recent commits
show_recent_commits() {
    echo "Recent commits (rollback targets):"
    echo "=================================="
    git log --oneline -10 --graph --decorate
    echo ""
}

# Function to show usage
show_usage() {
    echo "GitHub-based Rollback Script"
    echo "============================"
    echo ""
    echo "This script performs rollback by creating a git revert commit"
    echo "and pushing to GitHub, which triggers automatic deployment."
    echo ""
    echo "Usage: $0 [commit-hash|HEAD~N]"
    echo ""
    echo "Examples:"
    echo "  $0                    # Rollback latest commit (HEAD)"
    echo "  $0 HEAD~1             # Rollback 1 commit back"
    echo "  $0 HEAD~3             # Rollback 3 commits back"
    echo "  $0 abc123def          # Rollback specific commit"
    echo ""
    show_recent_commits
}

# Main execution
main() {
    local target=${1:-"HEAD"}
    
    print_status "GitHub-based Production Rollback"
    print_status "================================"
    print_status "Repository: $GITHUB_REPO"
    print_status "Branch: $BRANCH"
    print_status "Time: $(date)"
    echo ""
    
    # Verify we're in git repository
    if ! git rev-parse --git-dir >/dev/null 2>&1; then
        print_error "Not in a git repository"
        exit 1
    fi
    
    # Verify we're on main branch
    local current_branch=$(git branch --show-current)
    if [ "$current_branch" != "$BRANCH" ]; then
        print_error "Not on $BRANCH branch (currently on: $current_branch)"
        print_status "Switching to $BRANCH branch..."
        git checkout "$BRANCH"
        git pull origin "$BRANCH"
    fi
    
    # Handle help
    if [ "$target" = "help" ] || [ "$target" = "-h" ] || [ "$target" = "--help" ]; then
        show_usage
        exit 0
    fi
    
    # Show recent commits for context
    show_recent_commits
    
    # Perform rollback
    github_rollback "$target"
    
    local exit_code=$?
    
    if [ $exit_code -eq 0 ]; then
        print_success "GitHub rollback process completed!"
        print_status "Production should be updated in 5-10 minutes"
        print_status "Monitor: https://github.com/$GITHUB_REPO/actions"
        print_status "Production URL: http://147.251.255.227:3000"
    else
        print_error "GitHub rollback failed"
    fi
    
    exit $exit_code
}

# Run main function
main "$@"