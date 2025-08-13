import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const screenshotDuration = new Trend('screenshot_duration');
const screenshotSuccess = new Counter('screenshot_success');
const screenshotFailures = new Counter('screenshot_failures');

// Test configuration
export const options = {
  scenarios: {
    // Smoke test - basic functionality
    smoke: {
      executor: 'constant-vus',
      vus: 1,
      duration: '30s',
      tags: { test_type: 'smoke' },
      env: { TEST_TYPE: 'smoke' }
    },
    
    // Load test - normal expected load
    load: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 10 }, // Ramp up
        { duration: '5m', target: 10 }, // Stay at load
        { duration: '2m', target: 0 },  // Ramp down
      ],
      tags: { test_type: 'load' },
      env: { TEST_TYPE: 'load' }
    },
    
    // Stress test - higher than normal load
    stress: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 20 }, // Ramp up
        { duration: '5m', target: 20 }, // Stress level
        { duration: '2m', target: 50 }, // Peak stress
        { duration: '3m', target: 50 }, // Hold peak
        { duration: '2m', target: 0 },  // Ramp down
      ],
      tags: { test_type: 'stress' },
      env: { TEST_TYPE: 'stress' }
    },
    
    // Spike test - sudden load increases
    spike: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 10 },  // Normal load
        { duration: '30s', target: 100 }, // Spike
        { duration: '2m', target: 100 },  // Hold spike
        { duration: '1m', target: 10 },   // Back to normal
        { duration: '1m', target: 0 },    // Ramp down
      ],
      tags: { test_type: 'spike' },
      env: { TEST_TYPE: 'spike' }
    }
  },
  
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% of requests under 2s
    http_req_failed: ['rate<0.1'],      // Error rate under 10%
    errors: ['rate<0.05'],              // Custom error rate under 5%
    screenshot_duration: ['p(95)<5000'], // Screenshot processing under 5s
  }
};

// Test URLs for screenshots
const testUrls = [
  'https://example.com',
  'https://httpbin.org/html',
  'https://jsonplaceholder.typicode.com',
  'https://httpstat.us/200',
  'https://httpbin.org/json',
  'https://www.google.com',
  'https://github.com',
  'https://stackoverflow.com'
];

// Test configurations for different screenshot types
const screenshotConfigs = [
  { width: 1920, height: 1080, format: 'png', fullPage: false },
  { width: 1280, height: 720, format: 'jpg', fullPage: false },
  { width: 800, height: 600, format: 'webp', fullPage: true },
  { width: 1920, height: 1080, format: 'png', fullPage: true },
  { width: 375, height: 667, format: 'png', fullPage: false, deviceType: 'mobile' }
];

// API key for authentication (set via environment)
const API_KEY = __ENV.API_KEY || 'test-api-key';
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export default function () {
  const testType = __ENV.TEST_TYPE || 'load';
  
  // Select random URL and config
  const url = testUrls[Math.floor(Math.random() * testUrls.length)];
  const config = screenshotConfigs[Math.floor(Math.random() * screenshotConfigs.length)];
  
  // Test different endpoints based on test type
  if (testType === 'smoke') {
    testHealthEndpoint();
    testBrowserStats();
  }
  
  // Test synchronous screenshot endpoint
  testSyncScreenshot(url, config);
  
  // Test asynchronous queue endpoint (for load/stress/spike tests)
  if (testType !== 'smoke') {
    testAsyncScreenshot(url, config);
  }
  
  // Add think time between requests
  sleep(Math.random() * 2 + 1); // 1-3 seconds
}

function testHealthEndpoint() {
  const response = http.get(`${BASE_URL}/api/health`);
  
  check(response, {
    'health endpoint status is 200': (r) => r.status === 200,
    'health endpoint has status field': (r) => JSON.parse(r.body).status !== undefined,
  });
}

function testBrowserStats() {
  const response = http.get(`${BASE_URL}/api/browser-stats`);
  
  check(response, {
    'browser stats status is 200': (r) => r.status === 200,
    'browser stats has data': (r) => JSON.parse(r.body).data !== undefined,
  });
}

function testSyncScreenshot(url, config) {
  const startTime = new Date().getTime();
  
  const payload = {
    url: url,
    ...config
  };
  
  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`
    },
    timeout: '30s'
  };
  
  const response = http.post(`${BASE_URL}/api/screenshot`, JSON.stringify(payload), params);
  
  const endTime = new Date().getTime();
  const duration = endTime - startTime;
  
  screenshotDuration.add(duration);
  
  const success = check(response, {
    'sync screenshot status is 200': (r) => r.status === 200,
    'sync screenshot has image field': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.image !== undefined;
      } catch (e) {
        return false;
      }
    },
    'sync screenshot response time < 10s': (r) => duration < 10000,
  });
  
  if (success) {
    screenshotSuccess.add(1);
  } else {
    screenshotFailures.add(1);
    errorRate.add(1);
    
    console.error(`Sync screenshot failed: ${response.status} - ${response.body}`);
  }
}

function testAsyncScreenshot(url, config) {
  const startTime = new Date().getTime();
  
  const payload = {
    url: url,
    ...config
  };
  
  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`
    },
    timeout: '10s'
  };
  
  // Queue screenshot job
  const response = http.post(`${BASE_URL}/api/screenshot/queue`, JSON.stringify(payload), params);
  
  const endTime = new Date().getTime();
  const queueDuration = endTime - startTime;
  
  const success = check(response, {
    'async screenshot queue status is 202': (r) => r.status === 202,
    'async screenshot has jobId': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.jobId !== undefined;
      } catch (e) {
        return false;
      }
    },
    'async screenshot queue response time < 5s': (r) => queueDuration < 5000,
  });
  
  if (!success) {
    errorRate.add(1);
    console.error(`Async screenshot queue failed: ${response.status} - ${response.body}`);
    return;
  }
  
  // Get job ID and check status
  let jobId;
  try {
    jobId = JSON.parse(response.body).jobId;
  } catch (e) {
    errorRate.add(1);
    return;
  }
  
  // Poll job status (simulate real user behavior)
  let attempts = 0;
  const maxAttempts = 10;
  let jobCompleted = false;
  
  while (attempts < maxAttempts && !jobCompleted) {
    sleep(2); // Wait 2 seconds between polls
    
    const statusResponse = http.get(`${BASE_URL}/api/screenshot/status/${jobId}`);
    
    if (statusResponse.status === 200) {
      try {
        const statusData = JSON.parse(statusResponse.body);
        if (statusData.status === 'completed') {
          jobCompleted = true;
          screenshotSuccess.add(1);
          
          const totalDuration = new Date().getTime() - startTime;
          screenshotDuration.add(totalDuration);
          
          check(statusResponse, {
            'async screenshot job completed': () => true,
            'async screenshot has result': () => statusData.result !== undefined,
          });
          
          break;
        } else if (statusData.status === 'failed') {
          screenshotFailures.add(1);
          errorRate.add(1);
          console.error(`Async screenshot job failed: ${JSON.stringify(statusData)}`);
          break;
        }
      } catch (e) {
        // Continue polling
      }
    }
    
    attempts++;
  }
  
  if (!jobCompleted && attempts >= maxAttempts) {
    screenshotFailures.add(1);
    errorRate.add(1);
    console.error(`Async screenshot job timed out after ${maxAttempts} attempts`);
  }
}

// Setup function - runs once before the test starts
export function setup() {
  console.log('Starting performance test...');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Test Type: ${__ENV.TEST_TYPE || 'load'}`);
  
  // Test basic connectivity
  const healthCheck = http.get(`${BASE_URL}/api/health`);
  if (healthCheck.status !== 200) {
    console.error('Health check failed - server may not be running');
    console.error(`Response: ${healthCheck.status} - ${healthCheck.body}`);
  }
  
  return { startTime: new Date() };
}

// Teardown function - runs once after the test ends
export function teardown(data) {
  const endTime = new Date();
  const testDuration = (endTime - data.startTime) / 1000;
  
  console.log(`\n=== Performance Test Summary ===`);
  console.log(`Test Duration: ${testDuration}s`);
  console.log(`Start Time: ${data.startTime.toISOString()}`);
  console.log(`End Time: ${endTime.toISOString()}`);
}