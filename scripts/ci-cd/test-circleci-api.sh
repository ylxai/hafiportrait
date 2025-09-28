#!/bin/bash

# Test CircleCI API endpoints to find the correct one
# Usage: ./scripts/test-circleci-api.sh

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}🧪 Testing CircleCI API Endpoints${NC}"
echo ""

# Check if API token is provided
if [ -z "$CIRCLECI_TOKEN" ]; then
    echo -e "${RED}❌ Error: CIRCLECI_TOKEN environment variable not set${NC}"
    echo "Get your token from: https://app.circleci.com/settings/user/tokens"
    echo "Then run: export CIRCLECI_TOKEN=your_token_here"
    exit 1
fi

# Project details
PROJECT_ID="8e6dea5c-200e-47f2-9ab4-907802fbd103"
PROJECT_SLUG="circleci/52Qu7EFEDcWDsxzc2AToaE/Jb6Jm6LujS94M8MwfwVjYN"
GITHUB_SLUG="gh/ylxai/hafiportrait"

# Test endpoints
declare -A ENDPOINTS=(
    ["CircleCI Slug"]="https://circleci.com/api/v2/project/${PROJECT_SLUG}/envvar"
    ["GitHub Slug"]="https://circleci.com/api/v2/project/${GITHUB_SLUG}/envvar"
    ["Project ID"]="https://circleci.com/api/v2/project/${PROJECT_ID}/envvar"
)

# Function to test endpoint
test_endpoint() {
    local name=$1
    local url=$2
    
    echo -n "Testing $name... "
    
    response=$(curl -s -H "Circle-Token: $CIRCLECI_TOKEN" "$url")
    
    if echo "$response" | grep -q '"message".*"Project not found"'; then
        echo -e "${RED}❌ Project not found${NC}"
    elif echo "$response" | grep -q '"message"'; then
        echo -e "${RED}❌ Error: $(echo "$response" | grep -o '"message":"[^"]*"')${NC}"
    elif echo "$response" | grep -q '\[\]' || echo "$response" | grep -q '"items"'; then
        echo -e "${GREEN}✅ Working (empty or with data)${NC}"
        echo "    URL: $url"
        return 0
    else
        echo -e "${YELLOW}⚠️ Unknown response${NC}"
        echo "    Response: $response"
    fi
    return 1
}

# Test all endpoints
working_endpoint=""
for name in "${!ENDPOINTS[@]}"; do
    if test_endpoint "$name" "${ENDPOINTS[$name]}"; then
        working_endpoint="${ENDPOINTS[$name]}"
        break
    fi
done

echo ""
if [ -n "$working_endpoint" ]; then
    echo -e "${GREEN}🎉 Found working endpoint!${NC}"
    echo "Use this URL for environment variable import:"
    echo "$working_endpoint"
else
    echo -e "${RED}❌ No working endpoints found${NC}"
    echo "Please check your project settings and API token"
fi