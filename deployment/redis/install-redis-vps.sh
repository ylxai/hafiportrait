#!/bin/bash

# ============================================================================
# Redis VPS Installation Script - Hafiportrait Photography Platform
# ============================================================================
# Purpose: Install dan configure Redis untuk production deployment
# Target: Ubuntu 20.04+ / Debian 11+ VPS
# ============================================================================

set -e  # Exit on error

echo "============================================================================"
echo "Redis Production Installation - Hafiportrait Platform"
echo "============================================================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}Error: Please run as root (use sudo)${NC}"
    exit 1
fi

# Update system packages
echo -e "${GREEN}[1/8] Updating system packages...${NC}"
apt-get update -qq

# Install Redis server
echo -e "${GREEN}[2/8] Installing Redis server...${NC}"
apt-get install -y redis-server redis-tools

# Stop Redis service untuk configuration
echo -e "${GREEN}[3/8] Stopping Redis service...${NC}"
systemctl stop redis-server

# Backup original configuration
echo -e "${GREEN}[4/8] Backing up original Redis configuration...${NC}"
if [ -f /etc/redis/redis.conf ]; then
    cp /etc/redis/redis.conf /etc/redis/redis.conf.backup.$(date +%Y%m%d_%H%M%S)
fi

# Generate strong Redis password
echo -e "${GREEN}[5/8] Generating strong Redis password...${NC}"
REDIS_PASSWORD=$(openssl rand -base64 32)
echo -e "${YELLOW}Generated Redis Password: ${REDIS_PASSWORD}${NC}"
echo -e "${YELLOW}IMPORTANT: Save this password securely!${NC}"
echo -e "${YELLOW}You will need it for .env.production configuration${NC}"
echo ""
echo "Redis Password: ${REDIS_PASSWORD}" > /root/redis-password.txt
chmod 600 /root/redis-password.txt
echo -e "${GREEN}Password saved to: /root/redis-password.txt${NC}"
echo ""

# Create Redis directories
echo -e "${GREEN}[6/8] Creating Redis directories...${NC}"
mkdir -p /var/lib/redis
mkdir -p /var/log/redis
chown redis:redis /var/lib/redis
chown redis:redis /var/log/redis
chmod 750 /var/lib/redis
chmod 750 /var/log/redis

# Deploy production configuration
echo -e "${GREEN}[7/8] Deploying production Redis configuration...${NC}"

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

if [ -f "${SCRIPT_DIR}/redis.production.conf" ]; then
    # Replace password placeholder in config
    sed "s/CHANGE_THIS_REDIS_PASSWORD_IN_PRODUCTION/${REDIS_PASSWORD}/g" \
        "${SCRIPT_DIR}/redis.production.conf" > /etc/redis/redis.conf
    
    chown redis:redis /etc/redis/redis.conf
    chmod 640 /etc/redis/redis.conf
    echo -e "${GREEN}Production configuration deployed successfully${NC}"
else
    echo -e "${RED}Error: redis.production.conf not found in ${SCRIPT_DIR}${NC}"
    echo -e "${YELLOW}Please ensure redis.production.conf is in the same directory as this script${NC}"
    exit 1
fi

# Configure systemd service
echo -e "${GREEN}[8/8] Configuring Redis systemd service...${NC}"
cat > /etc/systemd/system/redis.service << 'SYSTEMD_EOF'
[Unit]
Description=Redis In-Memory Data Store
After=network.target

[Service]
Type=notify
User=redis
Group=redis
ExecStart=/usr/bin/redis-server /etc/redis/redis.conf
ExecStop=/bin/kill -s TERM $MAINPID
Restart=always
RestartSec=5
LimitNOFILE=65536

# Security hardening
PrivateTmp=yes
NoNewPrivileges=yes
ProtectSystem=strict
ProtectHome=yes
ReadWritePaths=/var/lib/redis
ReadWritePaths=/var/log/redis

[Install]
WantedBy=multi-user.target
SYSTEMD_EOF

# Reload systemd dan enable Redis
systemctl daemon-reload
systemctl enable redis.service

# Disable transparent huge pages (Redis recommendation)
echo -e "${GREEN}Disabling transparent huge pages...${NC}"
echo never > /sys/kernel/mm/transparent_hugepage/enabled
echo never > /sys/kernel/mm/transparent_hugepage/defrag

# Make it persistent across reboots
cat > /etc/rc.local << 'RC_EOF'
#!/bin/sh -e
# Disable transparent huge pages for Redis
echo never > /sys/kernel/mm/transparent_hugepage/enabled
echo never > /sys/kernel/mm/transparent_hugepage/defrag
exit 0
RC_EOF
chmod +x /etc/rc.local

# Configure kernel parameters untuk Redis
echo -e "${GREEN}Configuring kernel parameters...${NC}"
cat >> /etc/sysctl.conf << 'SYSCTL_EOF'

# Redis optimizations
vm.overcommit_memory = 1
net.core.somaxconn = 65535
SYSCTL_EOF
sysctl -p

# Start Redis service
echo -e "${GREEN}Starting Redis service...${NC}"
systemctl start redis.service

# Wait for Redis to start
sleep 2

# Test Redis connection
echo -e "${GREEN}Testing Redis connection...${NC}"
if redis-cli -a "${REDIS_PASSWORD}" ping | grep -q "PONG"; then
    echo -e "${GREEN}✓ Redis is running successfully!${NC}"
else
    echo -e "${RED}✗ Redis connection test failed${NC}"
    systemctl status redis.service
    exit 1
fi

# Display Redis info
echo ""
echo "============================================================================"
echo -e "${GREEN}Redis Installation Complete!${NC}"
echo "============================================================================"
echo ""
echo "Redis Configuration:"
echo "  - Version: $(redis-cli -a "${REDIS_PASSWORD}" INFO server | grep redis_version | cut -d: -f2)"
echo "  - Port: 6379"
echo "  - Bind: 127.0.0.1 (localhost only)"
echo "  - Max Memory: 512MB"
echo "  - Persistence: RDB snapshots enabled"
echo "  - Log File: /var/log/redis/redis-server.log"
echo "  - Data Directory: /var/lib/redis"
echo ""
echo -e "${YELLOW}IMPORTANT - Update your .env.production:${NC}"
echo ""
echo "  REDIS_URL=\"redis://:${REDIS_PASSWORD}@localhost:6379\""
echo ""
echo -e "${YELLOW}Password also saved to: /root/redis-password.txt${NC}"
echo ""
echo "Useful commands:"
echo "  - Check status: systemctl status redis"
echo "  - View logs: tail -f /var/log/redis/redis-server.log"
echo "  - Connect to Redis: redis-cli -a 'YOUR_PASSWORD'"
echo "  - Test connection: redis-cli -a 'YOUR_PASSWORD' ping"
echo ""
echo "============================================================================"
