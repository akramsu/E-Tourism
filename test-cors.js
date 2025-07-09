// Test CORS connectivity from frontend
async function testCORS() {
  console.log('Testing CORS connectivity from frontend...');
  
  try {
    console.log('Testing from origin: http://localhost:3001');
    
    // Test 1: Fetch roles
    console.log('1. Testing roles endpoint...');
    const rolesResponse = await fetch('http://localhost:5003/api/auth/roles');
    
    if (!rolesResponse.ok) {
      throw new Error(`HTTP error! status: ${rolesResponse.status}`);
    }
    
    const rolesData = await rolesResponse.json();
    console.log('✅ Roles fetch successful:', rolesData);
    
    // Test 2: Test health endpoint
    console.log('2. Testing health endpoint...');
    const healthResponse = await fetch('http://localhost:5003/api/health');
    
    if (!healthResponse.ok) {
      throw new Error(`HTTP error! status: ${healthResponse.status}`);
    }
    
    const healthData = await healthResponse.json();
    console.log('✅ Health check successful:', healthData);
    
    console.log('🎉 All CORS tests passed!');
    
  } catch (error) {
    console.error('❌ CORS test failed:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
  }
}

// Run the test
testCORS();
