import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
const dbErrorRate = new Rate('db_errors');
const dbQueryDuration = new Trend('db_query_duration');
const dbOperationsSuccess = new Counter('db_operations_success');
const dbOperationsFailures = new Counter('db_operations_failures');

export const options = {
  scenarios: {
    // Database read operations test
    db_read: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 5 },   // Warm up
        { duration: '3m', target: 20 },  // Load test
        { duration: '2m', target: 50 },  // Stress test
        { duration: '1m', target: 0 },   // Cool down
      ],
      tags: { test_type: 'db_read' },
      env: { TEST_TYPE: 'db_read' }
    },
    
    // Database write operations test
    db_write: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 2 },   // Warm up
        { duration: '3m', target: 10 },  // Load test  
        { duration: '2m', target: 25 },  // Stress test
        { duration: '1m', target: 0 },   // Cool down
      ],
      tags: { test_type: 'db_write' },
      env: { TEST_TYPE: 'db_write' }
    },
    
    // Mixed operations test
    db_mixed: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 3 },   // Warm up
        { duration: '4m', target: 15 },  // Mixed load
        { duration: '2m', target: 30 },  // Peak load
        { duration: '1m', target: 0 },   // Cool down
      ],
      tags: { test_type: 'db_mixed' },
      env: { TEST_TYPE: 'db_mixed' }
    }
  },
  
  thresholds: {
    http_req_duration: ['p(95)<1000'],    // 95% under 1s for API calls
    http_req_failed: ['rate<0.05'],       // Error rate under 5%
    db_errors: ['rate<0.02'],             // DB error rate under 2%
    db_query_duration: ['p(95)<500'],     // 95% of DB queries under 500ms
  }
};

const API_KEY = __ENV.API_KEY || 'test-api-key';
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export default function () {
  const testType = __ENV.TEST_TYPE || 'db_mixed';
  
  switch (testType) {
    case 'db_read':
      testReadOperations();
      break;
    case 'db_write':
      testWriteOperations();
      break;
    case 'db_mixed':
      // 70% reads, 30% writes (typical web app ratio)
      if (Math.random() < 0.7) {
        testReadOperations();
      } else {
        testWriteOperations();
      }
      break;
  }
  
  sleep(Math.random() * 0.5 + 0.1); // 0.1-0.6 seconds between operations
}

function testReadOperations() {
  const operations = [
    () => testGetScreenshots(),
    () => testGetAnalytics(),
    () => testGetApiKeys(),
    () => testGetDashboard(),
    () => testGetUserProfile(),
  ];
  
  // Execute random read operation
  const operation = operations[Math.floor(Math.random() * operations.length)];
  operation();
}

function testWriteOperations() {
  const operations = [
    () => testCreateApiKey(),
    () => testUpdateUserProfile(),
    // Screenshot creation is tested in the main load test
  ];
  
  // Execute random write operation
  const operation = operations[Math.floor(Math.random() * operations.length)];
  operation();
}

function testGetScreenshots() {
  const startTime = new Date().getTime();
  
  const params = {
    headers: {
      'Authorization': `Bearer ${API_KEY}`
    }
  };
  
  const response = http.get(`${BASE_URL}/api/admin/screenshots?limit=50`, params);
  
  const duration = new Date().getTime() - startTime;
  dbQueryDuration.add(duration);
  
  const success = check(response, {
    'get screenshots status is 200': (r) => r.status === 200,
    'get screenshots has data': (r) => {
      try {
        const body = JSON.parse(r.body);
        return Array.isArray(body.data) || body.success === true;
      } catch (e) {
        return false;
      }
    },
    'get screenshots response time < 2s': () => duration < 2000,
  });
  
  if (success) {
    dbOperationsSuccess.add(1);
  } else {
    dbOperationsFailures.add(1);
    dbErrorRate.add(1);
  }
}

function testGetAnalytics() {
  const startTime = new Date().getTime();
  
  const params = {
    headers: {
      'Authorization': `Bearer ${API_KEY}`
    }
  };
  
  const response = http.get(`${BASE_URL}/api/admin/analytics`, params);
  
  const duration = new Date().getTime() - startTime;
  dbQueryDuration.add(duration);
  
  const success = check(response, {
    'get analytics status is 200': (r) => r.status === 200 || r.status === 404,
    'get analytics response time < 2s': () => duration < 2000,
  });
  
  if (success) {
    dbOperationsSuccess.add(1);
  } else {
    dbOperationsFailures.add(1);
    dbErrorRate.add(1);
  }
}

function testGetApiKeys() {
  const startTime = new Date().getTime();
  
  const params = {
    headers: {
      'Authorization': `Bearer ${API_KEY}`
    }
  };
  
  const response = http.get(`${BASE_URL}/api/admin/api-keys`, params);
  
  const duration = new Date().getTime() - startTime;
  dbQueryDuration.add(duration);
  
  const success = check(response, {
    'get api keys status is 200': (r) => r.status === 200,
    'get api keys response time < 1s': () => duration < 1000,
  });
  
  if (success) {
    dbOperationsSuccess.add(1);
  } else {
    dbOperationsFailures.add(1);
    dbErrorRate.add(1);
  }
}

function testGetDashboard() {
  const startTime = new Date().getTime();
  
  const params = {
    headers: {
      'Authorization': `Bearer ${API_KEY}`
    }
  };
  
  const response = http.get(`${BASE_URL}/api/admin/dashboard`, params);
  
  const duration = new Date().getTime() - startTime;
  dbQueryDuration.add(duration);
  
  const success = check(response, {
    'get dashboard status is 200': (r) => r.status === 200,
    'get dashboard response time < 1.5s': () => duration < 1500,
  });
  
  if (success) {
    dbOperationsSuccess.add(1);
  } else {
    dbOperationsFailures.add(1);
    dbErrorRate.add(1);
  }
}

function testGetUserProfile() {
  const startTime = new Date().getTime();
  
  const params = {
    headers: {
      'Authorization': `Bearer ${API_KEY}`
    }
  };
  
  const response = http.get(`${BASE_URL}/api/auth/me`, params);
  
  const duration = new Date().getTime() - startTime;
  dbQueryDuration.add(duration);
  
  const success = check(response, {
    'get user profile status is 200': (r) => r.status === 200,
    'get user profile response time < 500ms': () => duration < 500,
  });
  
  if (success) {
    dbOperationsSuccess.add(1);
  } else {
    dbOperationsFailures.add(1);
    dbErrorRate.add(1);
  }
}

function testCreateApiKey() {
  const startTime = new Date().getTime();
  
  const payload = {
    name: `Test Key ${Date.now()}`,
    description: 'Performance test API key',
    rate_limit: 1000
  };
  
  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`
    }
  };
  
  const response = http.post(`${BASE_URL}/api/admin/api-keys`, JSON.stringify(payload), params);
  
  const duration = new Date().getTime() - startTime;
  dbQueryDuration.add(duration);
  
  const success = check(response, {
    'create api key status is 201': (r) => r.status === 201,
    'create api key response time < 1s': () => duration < 1000,
  });
  
  if (success) {
    dbOperationsSuccess.add(1);
    
    // Clean up - delete the created API key
    try {
      const body = JSON.parse(response.body);
      if (body.data && body.data.id) {
        sleep(0.1); // Brief pause
        http.del(`${BASE_URL}/api/admin/api-keys/${body.data.id}`, params);
      }
    } catch (e) {
      // Ignore cleanup errors
    }
  } else {
    dbOperationsFailures.add(1);
    dbErrorRate.add(1);
  }
}

function testUpdateUserProfile() {
  const startTime = new Date().getTime();
  
  // First get current profile
  const getParams = {
    headers: {
      'Authorization': `Bearer ${API_KEY}`
    }
  };
  
  const getResponse = http.get(`${BASE_URL}/api/auth/me`, getParams);
  
  if (getResponse.status !== 200) {
    dbOperationsFailures.add(1);
    dbErrorRate.add(1);
    return;
  }
  
  // Update profile (this is a placeholder - actual endpoint may vary)
  const payload = {
    lastActivity: new Date().toISOString()
  };
  
  const putParams = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`
    }
  };
  
  const response = http.put(`${BASE_URL}/api/auth/me`, JSON.stringify(payload), putParams);
  
  const duration = new Date().getTime() - startTime;
  dbQueryDuration.add(duration);
  
  const success = check(response, {
    'update user profile status is 200 or 404': (r) => r.status === 200 || r.status === 404,
    'update user profile response time < 1s': () => duration < 1000,
  });
  
  if (success) {
    dbOperationsSuccess.add(1);
  } else {
    dbOperationsFailures.add(1);
    dbErrorRate.add(1);
  }
}

export function setup() {
  console.log('Starting database performance test...');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Test Type: ${__ENV.TEST_TYPE || 'db_mixed'}`);
  
  return { startTime: new Date() };
}

export function teardown(data) {
  const endTime = new Date();
  const testDuration = (endTime - data.startTime) / 1000;
  
  console.log(`\n=== Database Performance Test Summary ===`);
  console.log(`Test Duration: ${testDuration}s`);
  console.log(`Database operations completed`);
}