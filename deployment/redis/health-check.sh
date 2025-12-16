#!/bin/bash

# ============================================================================
# Redis Health Check Script - Hafiportrait Photography Platform
# ============================================================================
# Purpose: Monitor Redis health, memory, performance
# Usage: ./health-check.sh [password]
# ============================================================================

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Get Redis password dari argument atau environment
REDIS_PASSWORD="${1:-${REDIS_PASSWORD}}"

if [ -z "$REDIS_PASSWORD" ]; then
    echo -e "${RED}Error: Redis password required${NC}"
    echo "Usage: $0 <redis-password>"
    echo "Or set REDIS_PASSWORD environment variable"
    exit 1
fi

echo "============================================================================"
echo -e "${BLUE}Redis Health Check - $(date)${NC}"
echo "============================================================================"
echo ""

# Function untuk execute redis-cli commands
redis_cmd() {
    redis-cli -a "$REDIS_PASSWORD" --no-auth-warning "$@" 2>/dev/null
}

# Test connection
echo -e "${BLUE}[1] Connection Test${NC}"
if redis_cmd ping | grep -q "PONG"; then
    echo -e "${GREEN}✓ Redis is responding${NC}"
else
    echo -e "${RED}✗ Redis is not responding${NC}"
    exit 1
fi
echo ""

# Server info
echo -e "${BLUE}[2] Server Information${NC}"
redis_cmd INFO server | grep -E "redis_version|os|uptime_in_days|uptime_in_seconds" | while read line; do
    echo "  $line"
done
echo ""

# Memory info
echo -e "${BLUE}[3] Memory Usage${NC}"
redis_cmd INFO memory | grep -E "used_memory_human|used_memory_peak_human|maxmemory_human|mem_fragmentation_ratio" | while read line; do
    echo "  $line"
done

# Check memory usage percentage
USED_MEMORY=$(redis_cmd INFO memory | grep "used_memory:" | cut -d: -f2 | tr -d '\r')
MAX_MEMORY=$(redis_cmd CONFIG GET maxmemory | tail -1 | tr -d '\r')

if [ "$MAX_MEMORY" != "0" ]; then
    MEMORY_PERCENT=$((USED_MEMORY * 100 / MAX_MEMORY))
    echo "  Memory Usage: ${MEMORY_PERCENT}%"
    
    if [ $MEMORY_PERCENT -gt 90 ]; then
        echo -e "${RED}  ⚠ WARNING: Memory usage above 90%${NC}"
    elif [ $MEMORY_PERCENT -gt 75 ]; then
        echo -e "${YELLOW}  ⚠ CAUTION: Memory usage above 75%${NC}"
    else
        echo -e "${GREEN}  ✓ Memory usage is healthy${NC}"
    fi
fi
echo ""

# Stats
echo -e "${BLUE}[4] Performance Stats${NC}"
redis_cmd INFO stats | grep -E "total_connections_received|total_commands_processed|instantaneous_ops_per_sec|rejected_connections|expired_keys|evicted_keys" | while read line; do
    echo "  $line"
done
echo ""

# Clients
echo -e "${BLUE}[5] Client Connections${NC}"
redis_cmd INFO clients | grep -E "connected_clients|blocked_clients" | while read line; do
    echo "  $line"
done
echo ""

# Persistence
echo -e "${BLUE}[6] Persistence Status${NC}"
redis_cmd INFO persistence | grep -E "loading|rdb_last_save_time|rdb_last_bgsave_status|rdb_changes_since_last_save" | while read line; do
    echo "  $line"
done

# Check last save time
LAST_SAVE=$(redis_cmd LASTSAVE)
CURRENT_TIME=$(date +%s)
TIME_SINCE_SAVE=$((CURRENT_TIME - LAST_SAVE))
HOURS_SINCE_SAVE=$((TIME_SINCE_SAVE / 3600))

echo "  Last save: $HOURS_SINCE_SAVE hours ago"

if [ $HOURS_SINCE_SAVE -gt 24 ]; then
    echo -e "${YELLOW}  ⚠ WARNING: Last save was more than 24 hours ago${NC}"
fi
echo ""

# Replication (jika ada)
echo -e "${BLUE}[7] Replication${NC}"
ROLE=$(redis_cmd INFO replication | grep "role:" | cut -d: -f2 | tr -d '\r')
echo "  Role: $ROLE"

if [ "$ROLE" = "master" ]; then
    redis_cmd INFO replication | grep -E "connected_slaves" | while read line; do
        echo "  $line"
    done
fi
echo ""

# Slow log
echo -e "${BLUE}[8] Slow Queries (Last 5)${NC}"
SLOW_COUNT=$(redis_cmd SLOWLOG LEN)
echo "  Total slow queries logged: $SLOW_COUNT"

if [ "$SLOW_COUNT" != "0" ]; then
    echo ""
    redis_cmd SLOWLOG GET 5 | head -20
else
    echo -e "${GREEN}  ✓ No slow queries${NC}"
fi
echo ""

# Key space
echo -e "${BLUE}[9] Database Keyspace${NC}"
redis_cmd INFO keyspace | grep "^db" | while read line; do
    echo "  $line"
done

if ! redis_cmd INFO keyspace | grep -q "^db"; then
    echo -e "${YELLOW}  No keys in any database${NC}"
fi
echo ""

# Sample keys by prefix (untuk debugging)
echo -e "${BLUE}[10] Sample Keys by Prefix${NC}"
for prefix in "rate-limit" "session" "socket" "upload" "cache"; do
    # Use SCAN instead of KEYS untuk production safety
    COUNT=$(redis_cmd --scan --pattern "${prefix}:*" | wc -l)
    if [ "$COUNT" -gt 0 ]; then
        echo "  ${prefix}:* = $COUNT keys"
    fi
done
echo ""

# Overall health summary
echo "============================================================================"
echo -e "${BLUE}Health Summary${NC}"
echo "============================================================================"

# Check for issues
ISSUES=0

# Check memory
if [ "$MAX_MEMORY" != "0" ] && [ $MEMORY_PERCENT -gt 90 ]; then
    echo -e "${RED}✗ High memory usage ($MEMORY_PERCENT%)${NC}"
    ISSUES=$((ISSUES + 1))
fi

# Check rejected connections
REJECTED=$(redis_cmd INFO stats | grep "rejected_connections:" | cut -d: -f2 | tr -d '\r')
if [ "$REJECTED" != "0" ]; then
    echo -e "${RED}✗ Rejected connections detected ($REJECTED)${NC}"
    ISSUES=$((ISSUES + 1))
fi

# Check last save
if [ $HOURS_SINCE_SAVE -gt 24 ]; then
    echo -e "${YELLOW}⚠ Last save over 24 hours ago${NC}"
    ISSUES=$((ISSUES + 1))
fi

if [ $ISSUES -eq 0 ]; then
    echo -e "${GREEN}✓ All checks passed - Redis is healthy${NC}"
else
    echo -e "${YELLOW}⚠ Found $ISSUES issue(s) - Review above${NC}"
fi

echo ""
echo "============================================================================"
