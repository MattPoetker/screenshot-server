import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter, Gauge } from 'k6/metrics';

// Custom metrics for browser pool testing
const browserPoolErrors = new Rate('browser_pool_errors');
const browserAllocationTime = new Trend('browser_allocation_time');
const activeBrowsers = new Gauge('active_browsers');
const poolUtilization = new Gauge('pool_utilization');
const screenshotQueue = new Gauge('screenshot_queue_size');

export const options = {
  scenarios: {
    // Browser pool stress test - gradual load increase
    pool_scaling: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 5 },    // Start with light load
        { duration: '2m', target: 15 },   // Increase to moderate load
        { duration: '3m', target: 30 },   // Heavy load - should trigger pool scaling
        { duration: '2m', target: 50 },   // Peak load - test pool limits
        { duration: '1m', target: 25 },   // Scale back down
        { duration: '1m', target: 0 },    // Cool down
      ],
      tags: { test_type: 'browser_pool_scaling' },
      env: { TEST_TYPE: 'pool_scaling' }
    },

    // Concurrent burst test - sudden load spike
    concurrent_burst: {
      executor: 'constant-arrival-rate',
      rate: 10, // 10 requests per second
      timeUnit: '1s',
      duration: '2m',
      preAllocatedVUs: 50,
      maxVUs: 100,
      tags: { test_type: 'concurrent_burst' },
      env: { TEST_TYPE: 'concurrent_burst' }
    },

    // Browser pool monitoring - continuous stats collection
    pool_monitor: {
      executor: 'constant-vus',
      vus: 1,
      duration: '10m', // Run throughout the test
      tags: { test_type: 'pool_monitor' },
      env: { TEST_TYPE: 'pool_monitor' }
    }
  },

  thresholds: {
    http_req_duration: ['p(95)<10000'],        // 95% under 10s (screenshots take time)
    http_req_failed: ['rate<0.05'],            // Error rate under 5%
    browser_pool_errors: ['rate<0.02'],        // Browser pool errors under 2%
    browser_allocation_time: ['p(95)<5000'],   // Browser allocation under 5s
    active_browsers: ['value>=3'],             // At least 3 browsers should be active
    pool_utilization: ['value<=0.9'],          // Pool utilization under 90%
  }
};

const API_KEY = __ENV.API_KEY || 'test-api-key';
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

// Test URLs optimized for browser pool testing
const testUrls = [
  'https://example.com',
  'https://httpbin.org/html',
  'https://httpstat.us/200',
  'https://jsonplaceholder.typicode.com',
  'https://httpbin.org/json'
];

// Screenshot configurations for different complexity levels
const screenshotConfigs = [
  { width: 1920, height: 1080, format: 'png', fullPage: false, complexity: 'simple' },
  { width: 1280, height: 720, format: 'jpg', fullPage: true, complexity: 'medium' },
  { width: 800, height: 600, format: 'webp', fullPage: false, complexity: 'simple' },
  { width: 1920, height: 1080, format: 'png', fullPage: true, complexity: 'complex' }
];

export default function () {
  const testType = __ENV.TEST_TYPE || 'pool_scaling';
  
  switch (testType) {
    case 'pool_scaling':
    case 'concurrent_burst':
      testBrowserPoolScaling();
      break;
    case 'pool_monitor':
      monitorBrowserPool();
      break;
  }
  
  // Add some variability in request timing
  sleep(Math.random() * 0.5 + 0.1); // 0.1-0.6 seconds
}

function testBrowserPoolScaling() {
  // Select random URL and config based on complexity
  const url = testUrls[Math.floor(Math.random() * testUrls.length)];
  const config = screenshotConfigs[Math.floor(Math.random() * screenshotConfigs.length)];
  
  // Record start time for browser allocation measurement
  const allocationStartTime = new Date().getTime();
  
  const payload = {
    url: url,
    width: config.width,
    height: config.height,
    format: config.format,
    fullPage: config.fullPage,
    // Add test identifier to track browser allocation
    testId: `browser-pool-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  };
  
  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`
    },
    timeout: '30s'
  };
  
  // Test asynchronous screenshot for better browser pool utilization tracking
  const response = http.post(`${BASE_URL}/api/screenshot/queue`, JSON.stringify(payload), params);
  
  const allocationTime = new Date().getTime() - allocationStartTime;
  browserAllocationTime.add(allocationTime);
  
  const success = check(response, {
    'browser pool scaling - queue status is 202': (r) => r.status === 202,
    'browser pool scaling - has jobId': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.jobId !== undefined;
      } catch (e) {
        return false;
      }
    },
    'browser pool scaling - allocation time reasonable': () => allocationTime < 10000,
  });
  
  if (!success) {
    browserPoolErrors.add(1);
    console.error(`Browser pool scaling test failed: ${response.status} - ${response.body}`);
    return;
  }
  
  // Get job ID for status checking
  let jobId;
  try {
    jobId = JSON.parse(response.body).jobId;
  } catch (e) {
    browserPoolErrors.add(1);
    return;
  }
  
  // Poll job status to verify browser pool handled the request
  let attempts = 0;
  const maxAttempts = 15; // Longer timeout for browser pool tests
  let jobCompleted = false;
  
  while (attempts < maxAttempts && !jobCompleted) {
    sleep(2); // Wait between polls
    
    const statusResponse = http.get(`${BASE_URL}/api/screenshot/status/${jobId}`);
    
    if (statusResponse.status === 200) {
      try {
        const statusData = JSON.parse(statusResponse.body);
        if (statusData.status === 'completed') {
          jobCompleted = true;
          break;
        } else if (statusData.status === 'failed') {
          browserPoolErrors.add(1);
          console.error(`Browser pool job failed: ${JSON.stringify(statusData)}`);
          break;
        }
      } catch (e) {
        // Continue polling
      }
    }
    
    attempts++;
  }
  
  if (!jobCompleted && attempts >= maxAttempts) {
    browserPoolErrors.add(1);
    console.error(`Browser pool job timed out after ${maxAttempts} attempts`);
  }
}

function monitorBrowserPool() {
  // Get browser pool statistics
  const statsResponse = http.get(`${BASE_URL}/api/browser-stats`);
  
  if (statsResponse.status === 200) {
    try {
      const stats = JSON.parse(statsResponse.body);
      
      if (stats.data) {
        // Update custom metrics with browser pool data
        if (stats.data.activeBrowsers !== undefined) {
          activeBrowsers.add(stats.data.activeBrowsers);
        }
        
        if (stats.data.maxBrowsers && stats.data.activeBrowsers) {
          const utilization = stats.data.activeBrowsers / stats.data.maxBrowsers;
          poolUtilization.add(utilization);
        }
        
        if (stats.data.queueSize !== undefined) {
          screenshotQueue.add(stats.data.queueSize);
        }
        
        // Log detailed stats for analysis
        console.log(`Browser Pool Stats: Active=${stats.data.activeBrowsers}, Max=${stats.data.maxBrowsers}, Queue=${stats.data.queueSize}, Memory=${stats.data.memoryUsage}MB`);
      }
    } catch (e) {
      console.error('Failed to parse browser stats:', e.message);
    }
  }
  
  // Get queue statistics
  const queueResponse = http.get(`${BASE_URL}/api/screenshot/queue/stats`);
  
  if (queueResponse.status === 200) {
    try {
      const queueStats = JSON.parse(queueResponse.body);
      
      if (queueStats.data) {
        // Log queue statistics
        console.log(`Queue Stats: Waiting=${queueStats.data.waiting}, Active=${queueStats.data.active}, Completed=${queueStats.data.completed}, Failed=${queueStats.data.failed}`);
      }
    } catch (e) {
      console.error('Failed to parse queue stats:', e.message);
    }
  }
  
  // Monitor system health
  const healthResponse = http.get(`${BASE_URL}/api/health`);
  
  check(healthResponse, {
    'browser pool monitor - health check passes': (r) => r.status === 200,
    'browser pool monitor - system responsive': (r) => r.timings.duration < 2000,
  });
  
  // Sleep longer for monitoring (it runs continuously)
  sleep(5); // 5 second intervals for monitoring
}

export function setup() {
  console.log('Starting browser pool scaling test...');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Test Type: ${__ENV.TEST_TYPE || 'pool_scaling'}`);
  
  // Test basic connectivity and browser pool status
  const healthCheck = http.get(`${BASE_URL}/api/health`);
  const browserStats = http.get(`${BASE_URL}/api/browser-stats`);
  
  if (healthCheck.status !== 200) {
    console.error('Health check failed - server may not be running');
    console.error(`Response: ${healthCheck.status} - ${healthCheck.body}`);
  }
  
  if (browserStats.status === 200) {
    try {
      const stats = JSON.parse(browserStats.body);
      console.log(`Initial Browser Pool State: ${JSON.stringify(stats.data, null, 2)}`);
    } catch (e) {
      console.error('Failed to parse initial browser stats');
    }
  }
  
  return { 
    startTime: new Date(),
    initialBrowsers: browserStats.status === 200 ? JSON.parse(browserStats.body) : null
  };
}

export function teardown(data) {
  const endTime = new Date();
  const testDuration = (endTime - data.startTime) / 1000;
  
  console.log(`\n=== Browser Pool Scaling Test Summary ===`);
  console.log(`Test Duration: ${testDuration}s`);
  console.log(`Start Time: ${data.startTime.toISOString()}`);
  console.log(`End Time: ${endTime.toISOString()}`);
  
  // Get final browser pool state
  const finalStats = http.get(`${BASE_URL}/api/browser-stats`);
  if (finalStats.status === 200) {
    try {
      const stats = JSON.parse(finalStats.body);
      console.log(`Final Browser Pool State: ${JSON.stringify(stats.data, null, 2)}`);
      
      if (data.initialBrowsers && data.initialBrowsers.data) {
        console.log(`\n=== Browser Pool Changes ===`);
        console.log(`Initial Active Browsers: ${data.initialBrowsers.data.activeBrowsers || 0}`);
        console.log(`Final Active Browsers: ${stats.data.activeBrowsers || 0}`);
        console.log(`Peak Browsers Used: ${stats.data.peakBrowsers || 'N/A'}`);
        console.log(`Total Screenshots Processed: ${stats.data.totalScreenshots || 'N/A'}`);
      }
    } catch (e) {
      console.error('Failed to parse final browser stats');
    }
  }
  
  console.log(`\nBrowser pool scaling test completed!`);
}