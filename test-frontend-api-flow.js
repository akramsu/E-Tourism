// Use Node.js built-in fetch (Node 18+) or https module
const https = require('https');
const http = require('http');

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const module = urlObj.protocol === 'https:' ? https : http;
    
    const req = module.request(url, {
      method: options.method || 'GET',
      headers: options.headers || {}
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({
            ok: res.statusCode >= 200 && res.statusCode < 300,
            status: res.statusCode,
            statusText: res.statusMessage,
            json: () => JSON.parse(data),
            text: () => data
          });
        } catch (err) {
          reject(err);
        }
      });
    });
    
    req.on('error', reject);
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

async function testFrontendAPIFlow() {
  try {
    console.log('🧪 Testing Frontend API Flow - Authority City Overview');
    console.log('==================================================');

    // Login first to get a valid token
    console.log('1. Logging in as authority user...');
    const loginResponse = await makeRequest('http://localhost:5003/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'user18@example.com',
        password: 'test123'
      })
    });

    if (!loginResponse.ok) {
      throw new Error('Login failed');
    }

    const loginData = await loginResponse.json();
    const token = loginData.token;
    console.log('✅ Login successful');

    // Test the same API calls that the frontend makes
    console.log('\n2. Testing Authority API endpoints...');
    
    const endpoints = [
      {
        name: 'City Metrics',
        url: '/api/authority/metrics?period=month&includeComparisons=true'
      },
      {
        name: 'Category Performance',
        url: '/api/authority/category-performance?period=month&includeComparisons=true'
      },
      {
        name: 'Tourism Insights',
        url: '/api/authority/tourism-insights?period=month&includeForecasts=true'
      },
      {
        name: 'City Revenue (The problematic one)',
        url: '/api/authority/revenue?period=month&breakdown=category&includeComparisons=true'
      },
      {
        name: 'Visitor Trends',
        url: '/api/authority/visitor-trends?period=month&groupBy=day&includeRevenue=true&includeComparisons=true'
      }
    ];

    for (const endpoint of endpoints) {
      console.log(`\n📡 Testing: ${endpoint.name}`);
      
      try {
        const response = await makeRequest(`http://localhost:5003${endpoint.url}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          console.log(`✅ ${endpoint.name} - Success:`, data.success);
          
          if (endpoint.name.includes('Revenue')) {
            console.log('📊 Revenue Data Structure:');
            console.log('- Success:', data.success);
            console.log('- Data keys:', Object.keys(data.data || {}));
            console.log('- topPerformer:', data.data?.topPerformer);
            console.log('- topPerformer.name:', data.data?.topPerformer?.name);
            console.log('- Full revenue data:', JSON.stringify(data.data, null, 2));
          }
        } else {
          console.log(`❌ ${endpoint.name} - Failed:`, response.status, response.statusText);
          const errorText = await response.text();
          console.log('Error response:', errorText);
        }
      } catch (err) {
        console.log(`❌ ${endpoint.name} - Error:`, err.message);
      }
    }

    console.log('\n3. Testing the data processing logic...');
    
    // Simulate the frontend's processApiDataToCityOverview function
    const revenueResponse = await makeRequest('http://localhost:5003/api/authority/revenue?period=month&breakdown=category&includeComparisons=true', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (revenueResponse.ok) {
      const revenueData = await revenueResponse.json();
      
      console.log('🔍 Simulating frontend data processing:');
      const topRevenueAttraction = revenueData.data.topPerformer?.name || 
                                  revenueData.data.topAttraction?.name ||
                                  'N/A';
      
      console.log('- Raw topPerformer:', revenueData.data.topPerformer);
      console.log('- Processed topRevenueAttraction:', topRevenueAttraction);
      
      if (topRevenueAttraction === 'N/A') {
        console.log('❌ ISSUE FOUND: topRevenueAttraction is N/A');
        console.log('- topPerformer:', revenueData.data.topPerformer);
        console.log('- topAttraction:', revenueData.data.topAttraction);
        console.log('- Full data keys:', Object.keys(revenueData.data));
      } else {
        console.log('✅ SUCCESS: topRevenueAttraction resolved to:', topRevenueAttraction);
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testFrontendAPIFlow();
