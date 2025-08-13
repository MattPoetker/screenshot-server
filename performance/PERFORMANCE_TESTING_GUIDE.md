# 📊 NiceShot API Performance Testing Guide

## Overview

This comprehensive performance testing suite validates NiceShot API's production readiness through multiple testing scenarios including load testing, browser pool scaling, database performance, and cache effectiveness.

## 🎯 Performance Goals

### Response Time Targets
- **Screenshot Generation**: <2s average response time
- **Database Queries**: 95% under 500ms  
- **Cache Hits**: <1s response time
- **Health Checks**: <100ms

### Throughput Targets
- **Concurrent Screenshots**: 1000+ simultaneous requests
- **Browser Pool**: Auto-scaling 3-10+ browsers
- **Database Connections**: Up to 20 concurrent connections
- **Queue Processing**: 5+ concurrent job processing

### Quality Targets
- **Error Rate**: <1% failed requests
- **Cache Hit Rate**: >60% for common requests
- **Uptime**: 99.9% availability
- **Memory Usage**: <2GB per browser instance

## 🛠️ Test Suite Components

### 1. Screenshot Load Test (`screenshot-load-test.js`)

**Purpose**: Validates screenshot generation under various load conditions

**Test Scenarios**:
- **Smoke Test**: Basic functionality validation (1 VU, 30s)
- **Load Test**: Normal expected load (10 VUs, 9 minutes)
- **Stress Test**: Higher than normal load (50 VUs peak, 14 minutes)
- **Spike Test**: Sudden load increases (100 VUs spike, 5.5 minutes)

**Key Metrics**:
- Screenshot processing time (target: <5s for 95%)
- HTTP request duration (target: <2s for 95%)
- Error rate (target: <10%)
- Success/failure counters

### 2. Database Load Test (`database-load-test.js`)

**Purpose**: Tests database performance under concurrent operations

**Test Scenarios**:
- **DB Read Test**: Heavy read operations (20 VUs peak, 7 minutes)
- **DB Write Test**: Write-heavy operations (10 VUs peak, 7 minutes)  
- **Mixed Operations**: 70% reads, 30% writes (15 VUs peak, 8 minutes)

**Operations Tested**:
- Get screenshots with pagination
- Get analytics data
- API key management
- User profile operations
- Dashboard data retrieval

**Key Metrics**:
- Database query duration (target: <500ms for 95%)
- Database error rate (target: <2%)
- Operation success/failure counters

### 3. Browser Pool Scaling Test (`browser-pool-scaling-test.js`)

**Purpose**: Validates browser pool auto-scaling and resource management

**Test Scenarios**:
- **Pool Scaling**: Gradual load increase to test auto-scaling (50 VUs peak, 10 minutes)
- **Concurrent Burst**: High-frequency requests (10 req/s, 2 minutes)
- **Pool Monitor**: Continuous statistics collection (1 VU, 10 minutes)

**Monitoring**:
- Active browser count
- Pool utilization percentage
- Browser allocation time
- Memory usage tracking
- Queue size monitoring

**Key Metrics**:
- Browser allocation time (target: <5s for 95%)
- Pool utilization (target: <90%)
- Browser pool errors (target: <2%)

### 4. Cache Performance Test (`cache-performance-test.js`)

**Purpose**: Tests screenshot caching effectiveness and performance

**Test Scenarios**:
- **Cache Warming**: Populate cache with common screenshots (3 VUs, 10 iterations)
- **Cache Hit Test**: Repeat requests to measure hit rate (25 VUs peak, 8 minutes)
- **Cache Invalidation**: Test cache refresh behavior (2 VUs, 3 minutes)

**Cache Strategy**:
- 80% requests target cached URLs
- 20% requests use unique URLs for cache misses
- Cache key based on URL + screenshot parameters

**Key Metrics**:
- Cache hit rate (target: >60%)
- Cache response time (target: <1s for hits)
- Cache bypass time (target: <8s for misses)

## 🚀 Running the Tests

### Prerequisites

1. **Install k6**:
   ```bash
   ./k6-install.sh
   ```

2. **Start the server**:
   ```bash
   npm run dev  # or docker-compose up
   ```

3. **Set environment variables**:
   ```bash
   export API_KEY="your-test-api-key"
   export BASE_URL="http://localhost:3000"
   ```

### Running Individual Tests

```bash
# Screenshot load testing
k6 run --env API_KEY="test-key" --env BASE_URL="http://localhost:3000" screenshot-load-test.js

# Database performance testing  
k6 run --env API_KEY="test-key" --env BASE_URL="http://localhost:3000" database-load-test.js

# Browser pool scaling
k6 run --env API_KEY="test-key" --env BASE_URL="http://localhost:3000" browser-pool-scaling-test.js

# Cache performance
k6 run --env API_KEY="test-key" --env BASE_URL="http://localhost:3000" cache-performance-test.js
```

### Running Complete Test Suite

```bash
# Run all tests with automated reporting
./run-all-tests.sh

# Quick smoke and load tests only
./run-all-tests.sh quick

# Full comprehensive testing (default)
./run-all-tests.sh full
```

## 📈 Understanding Results

### K6 Output Metrics

**Standard HTTP Metrics**:
- `http_req_duration`: Request response time
- `http_req_failed`: Failed request rate
- `http_reqs`: Total HTTP requests
- `vus`: Virtual users (concurrent connections)

**Custom Metrics**:
- `screenshot_duration`: Screenshot processing time
- `browser_allocation_time`: Time to allocate browser
- `db_query_duration`: Database operation time
- `cache_hits/cache_misses`: Cache effectiveness

### Performance Thresholds

The tests include automated pass/fail thresholds:

```javascript
thresholds: {
  http_req_duration: ['p(95)<2000'],    // 95% under 2s
  http_req_failed: ['rate<0.1'],        // <10% error rate
  screenshot_duration: ['p(95)<5000'],  // Screenshots <5s
  cache_hits: ['rate>0.6'],             // >60% cache hit rate
}
```

### Results Analysis

**Green (✓) Results**: All thresholds passed
- System performing within targets
- Ready for production load

**Yellow (⚠) Results**: Some thresholds failed
- Performance issues detected
- Optimization needed before production

**Red (✗) Results**: Major failures
- Significant performance problems
- Not ready for production

## 🔧 Performance Optimization Guide

### Database Optimization

**If database tests fail**:

1. **Add database indexes**:
   ```sql
   CREATE INDEX idx_screenshots_user_id ON screenshots(user_id);
   CREATE INDEX idx_screenshots_created_at ON screenshots(created_at);
   CREATE INDEX idx_api_keys_user_id ON api_keys(user_id);
   ```

2. **Optimize connection pooling**:
   ```typescript
   // Increase connection pool size
   maxConnections: 25,
   idleTimeout: 30000,
   connectionTimeout: 5000
   ```

3. **Query optimization**:
   ```sql
   -- Add LIMIT to large queries
   SELECT * FROM screenshots ORDER BY created_at DESC LIMIT 50;
   
   -- Use prepared statements
   PREPARE screenshot_query AS SELECT * FROM screenshots WHERE user_id = $1;
   ```

### Browser Pool Optimization

**If browser pool tests fail**:

1. **Increase pool size**:
   ```bash
   export MAX_BROWSERS=15
   export MAX_MEMORY_MB=3072
   ```

2. **Optimize memory management**:
   ```typescript
   // Enable aggressive cleanup
   args: [
     '--no-sandbox',
     '--disable-dev-shm-usage',
     '--memory-pressure-off',
     '--max_old_space_size=2048'
   ]
   ```

3. **Configure auto-scaling**:
   ```typescript
   // Dynamic scaling based on load
   if (queueSize > activeBrowsers * 3) {
     await createNewBrowser()
   }
   ```

### Cache Optimization

**If cache tests fail**:

1. **Increase cache memory**:
   ```bash
   export REDIS_MAXMEMORY=512mb
   export REDIS_MAXMEMORY_POLICY=allkeys-lru
   ```

2. **Optimize cache keys**:
   ```typescript
   // More granular cache keys
   const cacheKey = `screenshot:${url}:${width}x${height}:${format}:${fullPage}`
   ```

3. **Tune cache TTL**:
   ```typescript
   // Longer TTL for static content
   const ttl = isStaticContent(url) ? 3600 : 300; // 1hr vs 5min
   ```

### Network Optimization

**If response times are high**:

1. **Enable compression**:
   ```javascript
   app.use(compression({ threshold: 1024 }))
   ```

2. **Optimize image formats**:
   ```typescript
   // Use WebP for better compression
   format: quality > 0.8 ? 'png' : 'webp'
   ```

3. **CDN configuration**:
   ```bash
   # CloudFlare R2 with proper caching headers
   Cache-Control: public, max-age=86400
   ```

## 🎛️ Advanced Configuration

### Environment Variables

```bash
# Performance tuning
export MAX_BROWSERS=10
export QUEUE_CONCURRENCY=5
export REDIS_URL="redis://localhost:6379"

# Database optimization  
export DB_POOL_MAX=20
export DB_POOL_MIN=5
export DB_TIMEOUT=5000

# Cache configuration
export CACHE_TTL=300
export CACHE_MAX_SIZE=1000

# Test configuration
export API_KEY="test-api-key"
export BASE_URL="http://localhost:3000"
```

### Custom Test Scenarios

Create custom test scenarios by modifying the `options` object:

```javascript
export const options = {
  scenarios: {
    custom_load: {
      executor: 'constant-arrival-rate',
      rate: 50,              // 50 requests per second
      timeUnit: '1s',
      duration: '5m',
      preAllocatedVUs: 10,
      maxVUs: 100
    }
  }
}
```

## 📊 Production Monitoring

### Key Metrics to Monitor

1. **Response Times**:
   - P50, P95, P99 screenshot generation times
   - Database query response times
   - Cache hit/miss ratios

2. **Error Rates**:
   - HTTP 5xx error rates
   - Browser crashes and timeouts
   - Database connection failures

3. **Resource Usage**:
   - Memory usage per browser
   - CPU utilization
   - Network bandwidth

4. **Business Metrics**:
   - Screenshots generated per hour
   - User session duration
   - API calls per user

### Alerting Thresholds

```yaml
alerts:
  - name: "High Response Time"
    condition: "http_req_duration.p95 > 3000ms"
    
  - name: "High Error Rate"
    condition: "http_req_failed > 5%"
    
  - name: "Browser Pool Exhausted"
    condition: "browser_pool_utilization > 95%"
    
  - name: "Cache Hit Rate Low"
    condition: "cache_hit_rate < 50%"
```

## 🚀 Continuous Performance Testing

### CI/CD Integration

```yaml
# .github/workflows/performance.yml
- name: Performance Tests
  run: |
    docker-compose up -d
    sleep 30
    ./performance/run-all-tests.sh quick
    docker-compose down
```

### Regular Performance Validation

1. **Daily smoke tests**: Basic functionality validation
2. **Weekly load tests**: Full performance validation  
3. **Monthly stress tests**: Capacity planning validation
4. **Pre-release tests**: Complete test suite before deployment

---

## 📞 Support & Troubleshooting

### Common Issues

**Tests timeout or fail to start**:
- Verify server is running: `curl http://localhost:3000/api/health`
- Check API key: `export API_KEY="valid-api-key"`
- Increase test timeouts in k6 options

**High error rates**:
- Check server logs for errors
- Verify database connectivity
- Monitor browser pool status

**Poor performance results**:
- Check system resources (CPU, memory)
- Verify database indexes exist
- Monitor network latency

### Getting Help

1. Check server logs: `docker-compose logs -f app`
2. Monitor system resources: `htop` or `docker stats`
3. Review test logs in `./performance-results/`
4. Analyze k6 JSON output for detailed metrics

---

**Last Updated**: January 2025  
**Performance Test Suite Version**: 1.0