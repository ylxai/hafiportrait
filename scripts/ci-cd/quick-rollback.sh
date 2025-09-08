#!/bin/bash

# Quick Emergency Rollback Script (30 seconds)
# Usage: bash scripts/ci-cd/quick-rollback.sh

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${RED}🚨 EMERGENCY ROLLBACK INITIATED${NC}"
echo "=================================="

# Quick health check
echo "🔍 Checking current status..."
if curl -s --max-time 5 http://localhost:3000/api/health | grep -q "healthy"; then
    echo -e "${YELLOW}⚠️  Current app appears healthy. Continue anyway? (y/N)${NC}"
    read -t 10 -n 1 -r || REPLY="n"
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Emergency rollback cancelled"
        exit 0
    fi
fi

cd /home/ubuntu/stable

# Method 1: Try latest backup (fastest)
echo "🔄 Attempting backup rollback..."
LATEST_BACKUP=$(ls -t .next.backup.* 2>/dev/null | head -1)

if [ -n "$LATEST_BACKUP" ]; then
    echo "📦 Using backup: $LATEST_BACKUP"
    rm -rf .next
    cp -r "$LATEST_BACKUP" .next
    pm2 restart ecosystem.config.js --env production
    
    sleep 3
    if curl -s --max-time 5 http://localhost:3000/api/health | grep -q "healthy"; then
        echo -e "${GREEN}✅ Emergency rollback successful using backup!${NC}"
        echo "🌐 Production: http://147.251.255.227:3000"
        exit 0
    fi
fi

# Method 2: Git rollback
echo "🔄 Attempting git rollback..."
git checkout HEAD~1
pm2 restart ecosystem.config.js --env production

sleep 3
if curl -s --max-time 5 http://localhost:3000/api/health | grep -q "healthy"; then
    echo -e "${GREEN}✅ Emergency rollback successful using git!${NC}"
    echo "🌐 Production: http://147.251.255.227:3000"
    exit 0
fi

# Method 3: Last resort - restart with current code
echo "🔄 Last resort: restarting current deployment..."
pm2 restart ecosystem.config.js --env production

sleep 3
if curl -s --max-time 5 http://localhost:3000/api/health | grep -q "healthy"; then
    echo -e "${YELLOW}⚠️  App restarted but may still have issues${NC}"
    echo "🌐 Production: http://147.251.255.227:3000"
    exit 0
fi

echo -e "${RED}❌ Emergency rollback failed - manual intervention required${NC}"
echo "📞 Contact system administrator immediately"
exit 1