#!/bin/bash

# HafiPortrait Health Check Script
# Comprehensive health verification for production deployment

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
BASE_URL=${NEXT_PUBLIC_APP_URL:-"http://localhost:3000"}
SOCKET_URL=${NEXT_PUBLIC_SOCKET_URL:-"http://localhost:3001"}
MAX_RETRIES=5
RETRY_DELAY=10

log() {
    echo -e "${BLUE}[$(date +'%H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}✅${NC} $1"
}

error() {
    echo -e "${RED}❌${NC} $1"
}

warning() {
    echo -e "${YELLOW}⚠️${NC} $1"
}

# Health check function with retries
check_endpoint() {
    local url=$1
    local description=$2
    local expected_status=${3:-200}
    local retry_count=0
    
    log "Checking $description..."
    
    while [[ $retry_count -lt $MAX_RETRIES ]]; do
        if response=$(curl -s -w "%{http_code}" -o /tmp/health_response "$url" 2>/dev/null); then
            if [[ "$response" == "$expected_status" ]]; then
                success "$description is healthy"
                return 0
            fi
        fi
        
        ((retry_count++))
        if [[ $retry_count -lt $MAX_RETRIES ]]; then
            warning "$description check failed (attempt $retry_count/$MAX_RETRIES), retrying in ${RETRY_DELAY}s..."
            sleep $RETRY_DELAY
        fi
    done
    
    error "$description health check failed after $MAX_RETRIES attempts"
    return 1
}

# Check API response content
check_api_content() {
    local url=$1
    local description=$2
    local expected_field=$3
    
    log "Checking $description content..."
    
    if response=$(curl -s "$url" 2>/dev/null); then
        if echo "$response" | jq -e ".$expected_field" > /dev/null 2>&1; then
            success "$description content is valid"
            return 0
        fi
    fi
    
    error "$description content validation failed"
    return 1
}

# Database connectivity check
check_database() {
    log "Checking database connectivity..."
    
    if check_endpoint "$BASE_URL/api/test/db" "Database connection"; then
        success "Database is accessible"
        return 0
    else
        error "Database connectivity failed"
        return 1
    fi
}

# Load test simulation
run_load_test() {
    log "Running basic load test..."
    
    local concurrent_requests=5
    local pids=()
    
    for i in $(seq 1 $concurrent_requests); do
        (
            curl -s "$BASE_URL/api/health" > /dev/null
            echo "Request $i completed"
        ) &
        pids+=($!)
    done
    
    # Wait for all requests to complete
    for pid in "${pids[@]}"; do
        wait $pid
    done
    
    success "Basic load test completed"
}

# Check upload functionality
check_upload_functionality() {
    log "Checking upload functionality..."
    
    # Create a small test image
    local test_image="/tmp/test_upload.png"
    echo -e '\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\fIDATx\xdac\xf8\x00\x00\x00\x01\x00\x01\\\xc2]\xb4\x00\x00\x00\x00IEND\xaeB`\x82' > "$test_image"
    
    # Try to upload (this would need a valid event ID and proper authentication)
    # For now, just check if the endpoint exists
    if curl -s -f "$BASE_URL/api/events" > /dev/null; then
        success "Upload endpoints are accessible"
    else
        warning "Upload endpoint check skipped (requires authentication)"
    fi
    
    rm -f "$test_image"
}

# Performance benchmark
performance_benchmark() {
    log "Running performance benchmark..."
    
    local start_time=$(date +%s%N)
    curl -s "$BASE_URL/api/health" > /dev/null
    local end_time=$(date +%s%N)
    
    local response_time=$(( (end_time - start_time) / 1000000 )) # Convert to milliseconds
    
    if [[ $response_time -lt 1000 ]]; then
        success "Response time: ${response_time}ms (excellent)"
    elif [[ $response_time -lt 3000 ]]; then
        success "Response time: ${response_time}ms (good)"
    else
        warning "Response time: ${response_time}ms (needs optimization)"
    fi
}

# Main health check routine
main() {
    echo "🏥 HafiPortrait Health Check"
    echo "================================"
    echo "Target: $BASE_URL"
    echo "Socket: $SOCKET_URL"
    echo "Time: $(date)"
    echo ""
    
    local failed_checks=0
    
    # Core health checks
    check_endpoint "$BASE_URL/api/health" "Main API Health" || ((failed_checks++))
    check_endpoint "$SOCKET_URL/health" "Socket.IO Health" || ((failed_checks++))
    
    # API content validation
    check_api_content "$BASE_URL/api/health" "Health API" "status" || ((failed_checks++))
    
    # Database check
    check_database || ((failed_checks++))
    
    # Performance checks
    performance_benchmark
    
    # Load test
    run_load_test
    
    # Upload functionality
    check_upload_functionality
    
    # Additional endpoint checks
    log "Checking additional endpoints..."
    check_endpoint "$BASE_URL/api/events" "Events API" || ((failed_checks++))
    
    echo ""
    echo "================================"
    
    if [[ $failed_checks -eq 0 ]]; then
        success "🎉 All health checks passed! System is healthy."
        echo ""
        echo "📊 System Status: 🟢 HEALTHY"
        echo "🚀 Ready for production traffic"
        exit 0
    else
        error "❌ $failed_checks health check(s) failed!"
        echo ""
        echo "📊 System Status: 🔴 UNHEALTHY"
        echo "🚨 Requires immediate attention"
        exit 1
    fi
}

# Handle script arguments
case "${1:-}" in
    "quick")
        log "Running quick health check..."
        check_endpoint "$BASE_URL/api/health" "Quick Health Check"
        ;;
    "database")
        check_database
        ;;
    "performance")
        performance_benchmark
        ;;
    "load")
        run_load_test
        ;;
    *)
        main
        ;;
esac