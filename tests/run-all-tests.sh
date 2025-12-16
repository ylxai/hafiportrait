#!/bin/bash

# Hafiportrait - Automated Testing Suite Runner
# Run all tests in sequence dengan reporting

set -e

echo "======================================"
echo "🧪 Hafiportrait Testing Suite"
echo "======================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Function to run test suite
run_test_suite() {
    local name=$1
    local command=$2
    
    echo "----------------------------------------"
    echo "📋 Running: $name"
    echo "----------------------------------------"
    
    if eval "$command"; then
        echo -e "${GREEN}✅ $name: PASSED${NC}"
        ((PASSED_TESTS++))
    else
        echo -e "${RED}❌ $name: FAILED${NC}"
        ((FAILED_TESTS++))
    fi
    
    ((TOTAL_TESTS++))
    echo ""
}

# Start timestamp
START_TIME=$(date +%s)

echo "🔧 Setting up test environment..."
npm run test:setup || echo "⚠️  Setup warning (continuing...)"
echo ""

# Run test suites
run_test_suite "API Tests" "npm run test:api"
run_test_suite "Integration Tests" "npm run test:integration"
run_test_suite "Security Tests" "npm run test:security"
run_test_suite "Performance Tests" "npm run test:performance:api"

# Optional: Run E2E tests (can be slow)
if [ "$RUN_E2E" = "true" ]; then
    run_test_suite "E2E Tests" "npm run test:e2e"
    run_test_suite "Mobile Tests" "npm run test:mobile"
fi

# End timestamp
END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

# Summary
echo "======================================"
echo "📊 Test Summary"
echo "======================================"
echo "Total Suites: $TOTAL_TESTS"
echo -e "Passed: ${GREEN}$PASSED_TESTS${NC}"
echo -e "Failed: ${RED}$FAILED_TESTS${NC}"
echo "Duration: ${DURATION}s"
echo ""

# Exit code
if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}✅ All tests passed!${NC}"
    echo ""
    echo "🚀 Platform ready for deployment!"
    exit 0
else
    echo -e "${RED}❌ Some tests failed!${NC}"
    echo ""
    echo "⚠️  Please fix failing tests before deployment."
    exit 1
fi
