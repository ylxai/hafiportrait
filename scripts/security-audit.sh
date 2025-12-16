#!/bin/bash

echo "🔒 Hafiportrait Security Audit Tool"
echo "===================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check environment variables
echo "📋 Checking Environment Configuration..."
echo ""

check_env() {
  if [ -z "${!1}" ]; then
    echo -e "${RED}❌ $1 is not set${NC}"
    return 1
  else
    echo -e "${GREEN}✓${NC} $1 is configured"
    return 0
  fi
}

# Load .env.local if exists
if [ -f .env.local ]; then
  export $(cat .env.local | grep -v '^#' | xargs)
fi

# Critical checks
check_env "NEXTAUTH_SECRET"
check_env "DATABASE_URL"
check_env "REDIS_URL"

echo ""
echo "🔐 Checking JWT Secret Security..."
if [ -n "$NEXTAUTH_SECRET" ]; then
  SECRET_LENGTH=${#NEXTAUTH_SECRET}
  if [ $SECRET_LENGTH -ge 64 ]; then
    echo -e "${GREEN}✓${NC} JWT secret length: $SECRET_LENGTH chars (recommended: 64+)"
  elif [ $SECRET_LENGTH -ge 32 ]; then
    echo -e "${YELLOW}⚠${NC} JWT secret length: $SECRET_LENGTH chars (minimum: 32, recommended: 64+)"
  else
    echo -e "${RED}❌${NC} JWT secret too short: $SECRET_LENGTH chars (minimum: 32)"
  fi
fi

echo ""
echo "📊 Security Files Verification..."
SECURITY_FILES=(
  "lib/security/csrf.ts"
  "lib/security/session.ts"
  "lib/security/gallery-session.ts"
  "lib/security/rate-limit.ts"
  "lib/security/socket-auth.ts"
  "lib/security/input-validation.ts"
  "lib/security/monitoring.ts"
  "lib/middleware/security.ts"
  "server/socket-server-enhanced.js"
)

for file in "${SECURITY_FILES[@]}"; do
  if [ -f "$file" ]; then
    echo -e "${GREEN}✓${NC} $file"
  else
    echo -e "${RED}❌${NC} $file (missing)"
  fi
done

echo ""
echo "✅ Security Audit Complete"
echo ""
