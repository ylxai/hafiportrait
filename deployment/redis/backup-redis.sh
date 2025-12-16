#!/bin/bash

# ============================================================================
# Redis Backup Script - Hafiportrait Photography Platform
# ============================================================================
# Purpose: Backup Redis data (RDB snapshot)
# Usage: ./backup-redis.sh [password]
# ============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
BACKUP_DIR="/var/backups/redis"
REDIS_DATA_DIR="/var/lib/redis"
RETENTION_DAYS=7

# Get Redis password
REDIS_PASSWORD="${1:-${REDIS_PASSWORD}}"

if [ -z "$REDIS_PASSWORD" ]; then
    echo -e "${RED}Error: Redis password required${NC}"
    echo "Usage: $0 <redis-password>"
    exit 1
fi

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}Error: Please run as root (use sudo)${NC}"
    exit 1
fi

echo "============================================================================"
echo -e "${BLUE}Redis Backup - $(date)${NC}"
echo "============================================================================"
echo ""

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Trigger Redis save
echo -e "${GREEN}[1/4] Triggering Redis BGSAVE...${NC}"
redis-cli -a "$REDIS_PASSWORD" --no-auth-warning BGSAVE

# Wait for save to complete
echo -e "${GREEN}[2/4] Waiting for save to complete...${NC}"
sleep 2

while true; do
    LASTSAVE=$(redis-cli -a "$REDIS_PASSWORD" --no-auth-warning LASTSAVE)
    sleep 1
    NEWSAVE=$(redis-cli -a "$REDIS_PASSWORD" --no-auth-warning LASTSAVE)
    
    if [ "$NEWSAVE" -gt "$LASTSAVE" ]; then
        break
    fi
    
    echo -n "."
done
echo ""
echo -e "${GREEN}Save completed${NC}"

# Copy RDB file
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/redis_backup_$TIMESTAMP.rdb"

echo -e "${GREEN}[3/4] Copying RDB file...${NC}"
if [ -f "$REDIS_DATA_DIR/dump.rdb" ]; then
    cp "$REDIS_DATA_DIR/dump.rdb" "$BACKUP_FILE"
    
    # Compress backup
    gzip "$BACKUP_FILE"
    BACKUP_FILE="${BACKUP_FILE}.gz"
    
    # Get file size
    SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    
    echo -e "${GREEN}✓ Backup created: $BACKUP_FILE ($SIZE)${NC}"
else
    echo -e "${RED}✗ Error: RDB file not found${NC}"
    exit 1
fi

# Clean old backups
echo -e "${GREEN}[4/4] Cleaning old backups (older than $RETENTION_DAYS days)...${NC}"
find "$BACKUP_DIR" -name "redis_backup_*.rdb.gz" -mtime +$RETENTION_DAYS -delete
REMAINING=$(find "$BACKUP_DIR" -name "redis_backup_*.rdb.gz" | wc -l)
echo -e "${GREEN}✓ Retained backups: $REMAINING${NC}"

echo ""
echo "============================================================================"
echo -e "${GREEN}Backup Complete!${NC}"
echo "============================================================================"
echo "  Backup file: $BACKUP_FILE"
echo "  Size: $SIZE"
echo "  Total backups: $REMAINING"
echo "============================================================================"
