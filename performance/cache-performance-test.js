import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics for cache testing
const cacheHitRate = new Rate('cache_hits');
const cacheMissRate = new Rate('cache_misses');
const cacheResponseTime = new Trend('cache_response_time');
const cacheBypassTime = new Trend('cache_bypass_time');
const cacheSuccess = new Counter('cache_operations_success');
const cacheFailures = new Counter('cache_operations_failures');

export const options = {
  scenarios: {
    // Cache warming - populate cache with common screenshots
    cache_warming: {
      executor: 'per-vu-iterations',
      vus: 3,
      iterations: 10,
      maxDuration: '5m',
      tags: { test_type: 'cache_warming' },
      env: { TEST_TYPE: 'cache_warming' }
    },
    
    // Cache hit testing - repeat requests to test cache effectiveness
    cache_hit_test: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 5 },   // Warm up
        { duration: '3m', target: 15 },  // Sustained load
        { duration: '2m', target: 25 },  // Peak load
        { duration: '2m', target: 5 },   // Cool down
      ],
      tags: { test_type: 'cache_hit_test' },
      env: { TEST_TYPE: 'cache_hit_test' },
      startTime: '30s' // Start after cache warming
    },
    
    // Cache invalidation testing
    cache_invalidation: {
      executor: 'constant-vus',
      vus: 2,
      duration: '3m',
      tags: { test_type: 'cache_invalidation' },
      env: { TEST_TYPE: 'cache_invalidation' },
      startTime: '2m' // Start after some cache warming
    }
  },
  
  thresholds: {
    http_req_duration: ['p(95)<3000'],       // 95% under 3s (considering cache hits should be faster)
    http_req_failed: ['rate<0.03'],          // Error rate under 3%
    cache_hits: ['rate>0.6'],                // Cache hit rate should be above 60%
    cache_response_time: ['p(95)<1000'],     // Cache hits should be fast
    cache_bypass_time: ['p(95)<8000'],       // Cache misses can be slower
  }
};

const API_KEY = __ENV.API_KEY || 'test-api-key';
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

// Common URLs for cache testing - these will be repeated to test cache hits
const cacheTestUrls = [
  'https://example.com',
  'https://httpbin.org/html', 
  'https://httpstat.us/200',
  'https://jsonplaceholder.typicode.com',
  'https://httpbin.org/json'
];

// Standard screenshot configurations for cache testing
const cacheConfigs = [
  { width: 1920, height: 1080, format: 'png', fullPage: false },
  { width: 1280, height: 720, format: 'jpg', fullPage: false },
  { width: 800, height: 600, format: 'webp', fullPage: true }
];

// Variable URLs for cache miss testing
const uniqueUrls = [
  'https://httpbin.org/delay/1',
  'https://httpbin.org/uuid',
  'https://httpbin.org/base64/SFRUUEJJTiBpcyBhd2Vzb21l',
  'https://httpstat.us/201',
  'https://httpstat.us/202'
];

export default function () {
  const testType = __ENV.TEST_TYPE || 'cache_hit_test';
  
  switch (testType) {
    case 'cache_warming':
      warmCache();
      break;
    case 'cache_hit_test':
      testCacheHits();
      break;
    case 'cache_invalidation':
      testCacheInvalidation();
      break;
  }
  
  sleep(Math.random() * 1 + 0.5); // 0.5-1.5 seconds between requests
}

function warmCache() {
  // Use predictable combinations to warm the cache
  const urlIndex = Math.floor(Math.random() * cacheTestUrls.length);
  const configIndex = Math.floor(Math.random() * cacheConfigs.length);
  
  const url = cacheTestUrls[urlIndex];
  const config = cacheConfigs[configIndex];
  
  const payload = {
    url: url,
    width: config.width,
    height: config.height,
    format: config.format,
    fullPage: config.fullPage,
    // Add cache identifier
    cacheTest: 'warming'
  };
  
  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`
    },
    timeout: '20s'
  };
  
  console.log(`Cache warming: ${url} (${config.width}x${config.height}, ${config.format})`);
  
  const startTime = new Date().getTime();
  const response = http.post(`${BASE_URL}/api/screenshot`, JSON.stringify(payload), params);
  const endTime = new Date().getTime();
  const duration = endTime - startTime;
  
  // Record as cache bypass (warming)
  cacheBypassTime.add(duration);
  
  const success = check(response, {
    'cache warming - status is 200': (r) => r.status === 200,
    'cache warming - has image': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.image !== undefined;
      } catch (e) {
        return false;
      }
    },
    'cache warming - response time reasonable': () => duration < 15000,
  });
  
  if (success) {
    cacheSuccess.add(1);
  } else {
    cacheFailures.add(1);
    console.error(`Cache warming failed: ${response.status} - ${response.body}`);
  }
}

function testCacheHits() {
  // Heavily favor cached URLs (80% cached, 20% unique)
  const useCache = Math.random() < 0.8;
  const url = useCache 
    ? cacheTestUrls[Math.floor(Math.random() * cacheTestUrls.length)]
    : uniqueUrls[Math.floor(Math.random() * uniqueUrls.length)];
  
  // Use standard configs for cache testing
  const config = cacheConfigs[Math.floor(Math.random() * cacheConfigs.length)];
  
  const payload = {
    url: url,
    width: config.width,
    height: config.height,
    format: config.format,
    fullPage: config.fullPage,
    cacheTest: useCache ? 'hit_expected' : 'miss_expected'
  };
  
  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`,
      // Add cache preference header if supported
      'Cache-Control': 'max-age=300'
    },
    timeout: '15s'
  };
  
  const startTime = new Date().getTime();
  const response = http.post(`${BASE_URL}/api/screenshot`, JSON.stringify(payload), params);
  const endTime = new Date().getTime();
  const duration = endTime - startTime;
  
  // Determine if this was likely a cache hit based on response time
  const likelyCacheHit = duration < 2000; // Fast responses likely cache hits
  
  if (likelyCacheHit) {
    cacheHitRate.add(1);
    cacheResponseTime.add(duration);
  } else {
    cacheMissRate.add(1);
    cacheBypassTime.add(duration);
  }
  
  const success = check(response, {
    'cache hit test - status is 200': (r) => r.status === 200,
    'cache hit test - has image': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.image !== undefined;
      } catch (e) {
        return false;
      }
    },
    'cache hit test - response time acceptable': () => duration < 12000,
  });
  
  if (success) {
    cacheSuccess.add(1);
  } else {
    cacheFailures.add(1);
  }
  
  // Log cache analysis
  const expectedResult = useCache ? 'HIT' : 'MISS';
  const actualResult = likelyCacheHit ? 'HIT' : 'MISS';
  const match = expectedResult === actualResult ? '✓' : '✗';
  
  console.log(`Cache ${match}: Expected ${expectedResult}, Got ${actualResult} (${duration}ms) - ${url}`);
}

function testCacheInvalidation() {
  // Test cache invalidation by using the same URL with different parameters
  const baseUrl = cacheTestUrls[Math.floor(Math.random() * cacheTestUrls.length)];
  const config = cacheConfigs[Math.floor(Math.random() * cacheConfigs.length)];
  
  // Add timestamp to create cache variations
  const timestamp = Math.floor(Date.now() / 30000); // Changes every 30 seconds
  const url = `${baseUrl}?t=${timestamp}`;
  
  const payload = {
    url: url,
    width: config.width,
    height: config.height,
    format: config.format,
    fullPage: config.fullPage,
    cacheTest: 'invalidation'
  };
  
  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`
    },
    timeout: '15s'
  };
  
  const startTime = new Date().getTime();
  const response = http.post(`${BASE_URL}/api/screenshot`, JSON.stringify(payload), params);
  const endTime = new Date().getTime();
  const duration = endTime - startTime;
  
  // Cache invalidation tests typically result in cache misses initially
  cacheMissRate.add(1);
  cacheBypassTime.add(duration);
  
  const success = check(response, {
    'cache invalidation - status is 200': (r) => r.status === 200,
    'cache invalidation - has image': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.image !== undefined;
      } catch (e) {
        return false;
      }
    },
    'cache invalidation - response time acceptable': () => duration < 15000,
  });
  
  if (success) {
    cacheSuccess.add(1);
  } else {
    cacheFailures.add(1);
  }
  
  console.log(`Cache invalidation test: ${url} (${duration}ms)`);
}

export function setup() {
  console.log('Starting cache performance test...');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Test Type: ${__ENV.TEST_TYPE || 'cache_hit_test'}`);
  
  // Test basic connectivity
  const healthCheck = http.get(`${BASE_URL}/api/health`);
  if (healthCheck.status !== 200) {
    console.error('Health check failed - server may not be running');
    console.error(`Response: ${healthCheck.status} - ${healthCheck.body}`);
  }
  
  // Check if cache statistics are available
  const cacheStats = http.get(`${BASE_URL}/api/cache/stats`);
  if (cacheStats.status === 200) {
    try {
      const stats = JSON.parse(cacheStats.body);
      console.log(`Initial Cache State: ${JSON.stringify(stats.data, null, 2)}`);
    } catch (e) {
      console.log('Cache statistics not available or not parseable');
    }
  } else {
    console.log('Cache statistics endpoint not available');
  }
  
  return { 
    startTime: new Date(),
    testUrls: cacheTestUrls.length,
    testConfigs: cacheConfigs.length
  };
}

export function teardown(data) {
  const endTime = new Date();
  const testDuration = (endTime - data.startTime) / 1000;
  
  console.log(`\n=== Cache Performance Test Summary ===`);
  console.log(`Test Duration: ${testDuration}s`);
  console.log(`Test URLs Used: ${data.testUrls}`);
  console.log(`Test Configurations: ${data.testConfigs}`);
  
  // Get final cache statistics if available
  const finalCacheStats = http.get(`${BASE_URL}/api/cache/stats`);
  if (finalCacheStats.status === 200) {
    try {
      const stats = JSON.parse(finalCacheStats.body);
      console.log(`\n=== Final Cache Statistics ===`);
      console.log(`Cache Hits: ${stats.data.hits || 'N/A'}`);
      console.log(`Cache Misses: ${stats.data.misses || 'N/A'}`);
      console.log(`Cache Hit Ratio: ${stats.data.hitRatio || 'N/A'}%`);
      console.log(`Cache Size: ${stats.data.size || 'N/A'} items`);
      console.log(`Cache Memory Usage: ${stats.data.memoryUsage || 'N/A'}MB`);
    } catch (e) {
      console.log('Failed to parse final cache statistics');
    }
  }
  
  console.log(`\nCache performance test completed!`);
  console.log(`Expected behavior:`);
  console.log(`- Cache warming should populate cache with common screenshots`);
  console.log(`- Cache hit tests should show >60% hit rate after warming`);
  console.log(`- Cache hits should be significantly faster than misses`);
}