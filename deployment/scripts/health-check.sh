#!/bin/bash
# =============================================================================
# Health Check Script for Hafiportrait Photography Platform
# =============================================================================

echo "==================================="
echo "🏥 HEALTH CHECK - Hafiportrait Platform"
echo "==================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Redis password (use from environment or .env)
REDIS_PASS="Gtdd09BOfKm0+PZLtrHWjTMdojJLVS+WLVtAhDzq30M="

# Check Nginx
echo -n "🌐 Nginx Status: "
if systemctl is-active --quiet nginx; then
    echo -e "${GREEN}✓ Running${NC}"
else
    echo -e "${RED}✗ Not Running${NC}"
fi

# Check Redis
echo -n "💾 Redis Status: "
if systemctl is-active --quiet redis-server; then
    echo -e "${GREEN}✓ Running${NC}"
    
    # Test Redis connection
    echo -n "   Redis Auth Test: "
    if redis-cli -a "$REDIS_PASS" ping 2>/dev/null | grep -q "PONG"; then
        echo -e "${GREEN}✓ Connected${NC}"
    else
        echo -e "${RED}✗ Auth Failed${NC}"
    fi
    
    # Get Redis info
    echo -n "   Redis Memory: "
    redis-cli -a "$REDIS_PASS" INFO memory 2>/dev/null | grep "used_memory_human" | cut -d: -f2
else
    echo -e "${RED}✗ Not Running${NC}"
fi

# Check Nginx configuration
echo -n "⚙️  Nginx Config: "
if sudo nginx -t 2>&1 | grep -q "successful"; then
    echo -e "${GREEN}✓ Valid${NC}"
else
    echo -e "${RED}✗ Invalid${NC}"
fi

# Check ports
echo ""
echo "📡 Port Status:"
echo -n "   Port 80 (HTTP): "
if ss -tuln | grep -q ":80 "; then
    echo -e "${GREEN}✓ Listening${NC}"
else
    echo -e "${RED}✗ Not Listening${NC}"
fi

echo -n "   Port 443 (HTTPS): "
if ss -tuln | grep -q ":443 "; then
    echo -e "${GREEN}✓ Listening${NC}"
else
    echo -e "${YELLOW}⚠ Not Listening (SSL not configured yet)${NC}"
fi

echo -n "   Port 6379 (Redis): "
if ss -tuln | grep -q "127.0.0.1:6379"; then
    echo -e "${GREEN}✓ Listening (localhost only)${NC}"
else
    echo -e "${RED}✗ Not Listening${NC}"
fi

# Check firewall
echo ""
echo "🔒 Firewall Status:"
if sudo ufw status | grep -q "Status: active"; then
    echo -e "   ${GREEN}✓ Active${NC}"
    echo "   Open Ports: 22, 80, 443"
else
    echo -e "   ${YELLOW}⚠ Inactive${NC}"
fi

# Check disk space
echo ""
echo "💿 Disk Space:"
df -h / | tail -1 | awk '{print "   Root: "$3" used / "$2" total ("$5" used)"}'
df -h /var/lib/redis 2>/dev/null | tail -1 | awk '{print "   Redis: "$3" used / "$2" total ("$5" used)"}'

# Check memory
echo ""
echo "🧠 Memory Usage:"
free -h | grep "Mem:" | awk '{print "   Total: "$2" | Used: "$3" | Free: "$4" | Available: "$7}'

echo ""
echo "==================================="
echo "✅ Health check complete!"
echo "==================================="
