#!/bin/bash

# Comprehensive performance testing script for NiceShot API
echo "🚀 Starting NiceShot API Performance Test Suite"
echo "=============================================="

# Configuration
API_KEY="${API_KEY:-test-api-key}"
BASE_URL="${BASE_URL:-http://localhost:3000}"
OUTPUT_DIR="./performance-results"
TIMESTAMP=$(date +"%Y%m%d-%H%M%S")

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Create output directory
mkdir -p "$OUTPUT_DIR"

echo -e "${BLUE}Configuration:${NC}"
echo "  API Key: ${API_KEY:0:10}..."
echo "  Base URL: $BASE_URL"
echo "  Output Directory: $OUTPUT_DIR"
echo "  Timestamp: $TIMESTAMP"
echo ""

# Function to run a test and capture results
run_test() {
    local test_name=$1
    local test_file=$2
    local output_file="$OUTPUT_DIR/${test_name}_${TIMESTAMP}.json"
    local log_file="$OUTPUT_DIR/${test_name}_${TIMESTAMP}.log"
    
    echo -e "${YELLOW}Running $test_name...${NC}"
    echo "  Test File: $test_file"
    echo "  Output: $output_file"
    echo "  Log: $log_file"
    
    # Run k6 test with JSON output and logging
    k6 run \
        --env API_KEY="$API_KEY" \
        --env BASE_URL="$BASE_URL" \
        --out json="$output_file" \
        "$test_file" 2>&1 | tee "$log_file"
    
    local exit_code=${PIPESTATUS[0]}
    
    if [ $exit_code -eq 0 ]; then
        echo -e "  ${GREEN}✓ $test_name completed successfully${NC}"
    else
        echo -e "  ${RED}✗ $test_name failed (exit code: $exit_code)${NC}"
    fi
    
    echo ""
    return $exit_code
}

# Function to check if server is running
check_server() {
    echo -e "${BLUE}Checking server health...${NC}"
    
    local health_response=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/health" || echo "000")
    
    if [ "$health_response" = "200" ]; then
        echo -e "  ${GREEN}✓ Server is running and healthy${NC}"
        return 0
    else
        echo -e "  ${RED}✗ Server is not responding (HTTP $health_response)${NC}"
        echo "  Please ensure the server is running at $BASE_URL"
        return 1
    fi
}

# Function to generate summary report
generate_summary() {
    local summary_file="$OUTPUT_DIR/test_summary_${TIMESTAMP}.md"
    
    echo -e "${BLUE}Generating test summary...${NC}"
    
    cat > "$summary_file" << EOF
# NiceShot API Performance Test Results

**Test Date:** $(date)  
**Base URL:** $BASE_URL  
**Test Suite:** Comprehensive Performance Testing  

## Test Results Overview

EOF
    
    # Add results for each test
    local tests=("smoke-test" "screenshot-load-test" "database-load-test" "browser-pool-scaling-test" "cache-performance-test")
    
    for test in "${tests[@]}"; do
        local log_file="$OUTPUT_DIR/${test}_${TIMESTAMP}.log"
        
        if [ -f "$log_file" ]; then
            echo "### $test" >> "$summary_file"
            echo "" >> "$summary_file"
            
            # Extract key metrics from log
            local duration=$(grep "Test Duration:" "$log_file" | tail -1 | cut -d':' -f2 | tr -d ' ')
            local http_reqs=$(grep "http_reqs" "$log_file" | tail -1 || echo "Not available")
            local errors=$(grep "http_req_failed" "$log_file" | tail -1 || echo "Not available")
            
            echo "- **Duration:** $duration" >> "$summary_file"
            echo "- **HTTP Requests:** $http_reqs" >> "$summary_file"
            echo "- **Error Rate:** $errors" >> "$summary_file"
            echo "" >> "$summary_file"
        else
            echo "### $test" >> "$summary_file"
            echo "- **Status:** Test not run or failed" >> "$summary_file"
            echo "" >> "$summary_file"
        fi
    done
    
    cat >> "$summary_file" << EOF

## Performance Thresholds

### Screenshot Generation
- **Target Response Time:** <2s average
- **Peak Load:** 1000+ concurrent requests
- **Error Rate:** <1%
- **Browser Pool:** Auto-scaling 3-10+ browsers

### Database Operations  
- **Query Performance:** 95% under 500ms
- **Connection Pool:** 20 max connections
- **Error Rate:** <2%

### Cache Performance
- **Hit Rate:** >60% for common requests
- **Cache Response:** <1s for hits
- **Cache Miss:** <8s for misses

## Files Generated

EOF
    
    # List all generated files
    echo "### Test Output Files" >> "$summary_file"
    ls -la "$OUTPUT_DIR"/*"$TIMESTAMP"* | while read line; do
        echo "- \`$(echo "$line" | awk '{print $9}' | xargs basename)\`" >> "$summary_file"
    done
    
    echo "" >> "$summary_file"
    echo "**Summary Generated:** $(date)" >> "$summary_file"
    
    echo -e "  ${GREEN}✓ Summary saved to: $summary_file${NC}"
}

# Main execution
main() {
    echo -e "${BLUE}Starting performance test suite...${NC}"
    echo ""
    
    # Check if k6 is installed
    if ! command -v k6 &> /dev/null; then
        echo -e "${RED}✗ k6 is not installed${NC}"
        echo "  Please install k6 first:"
        echo "  ./k6-install.sh"
        exit 1
    fi
    
    # Check server health
    if ! check_server; then
        exit 1
    fi
    
    echo ""
    
    # Track test results
    local total_tests=0
    local passed_tests=0
    
    # Run all performance tests
    echo -e "${YELLOW}Phase 1: Smoke Testing${NC}"
    if run_test "smoke-test" "screenshot-load-test.js"; then
        ((passed_tests++))
    fi
    ((total_tests++))
    
    echo -e "${YELLOW}Phase 2: Screenshot Load Testing${NC}"
    if run_test "screenshot-load-test" "screenshot-load-test.js"; then
        ((passed_tests++))
    fi
    ((total_tests++))
    
    echo -e "${YELLOW}Phase 3: Database Load Testing${NC}"
    if run_test "database-load-test" "database-load-test.js"; then
        ((passed_tests++))
    fi
    ((total_tests++))
    
    echo -e "${YELLOW}Phase 4: Browser Pool Scaling${NC}"
    if run_test "browser-pool-scaling-test" "browser-pool-scaling-test.js"; then
        ((passed_tests++))
    fi
    ((total_tests++))
    
    echo -e "${YELLOW}Phase 5: Cache Performance${NC}"
    if run_test "cache-performance-test" "cache-performance-test.js"; then
        ((passed_tests++))
    fi
    ((total_tests++))
    
    # Generate summary
    generate_summary
    
    # Final results
    echo "=============================================="
    echo -e "${BLUE}Performance Test Suite Complete${NC}"
    echo ""
    echo "Results Summary:"
    echo "  Total Tests: $total_tests"
    echo -e "  Passed: ${GREEN}$passed_tests${NC}"
    echo -e "  Failed: ${RED}$((total_tests - passed_tests))${NC}"
    
    if [ $passed_tests -eq $total_tests ]; then
        echo -e "  ${GREEN}✓ All tests passed successfully!${NC}"
        exit 0
    else
        echo -e "  ${YELLOW}⚠ Some tests failed - check logs for details${NC}"
        exit 1
    fi
}

# Handle script arguments
case "${1:-}" in
    "help"|"-h"|"--help")
        echo "NiceShot API Performance Test Suite"
        echo ""
        echo "Usage: $0 [options]"
        echo ""
        echo "Environment Variables:"
        echo "  API_KEY    - API key for authentication (default: test-api-key)"
        echo "  BASE_URL   - Base URL for API (default: http://localhost:3000)"
        echo ""
        echo "Options:"
        echo "  help       - Show this help message"
        echo "  quick      - Run only smoke and basic load tests"
        echo "  full       - Run all performance tests (default)"
        echo ""
        exit 0
        ;;
    "quick")
        echo -e "${YELLOW}Running quick performance tests...${NC}"
        # Modify the test list for quick mode
        ;;
    "full"|"")
        # Run all tests (default)
        ;;
    *)
        echo -e "${RED}Unknown option: $1${NC}"
        echo "Use '$0 help' for usage information"
        exit 1
        ;;
esac

# Run main function
main