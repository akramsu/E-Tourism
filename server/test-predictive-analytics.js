const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const axios = require('axios');

const prisma = new PrismaClient();

async function testPredictiveAnalytics() {
  try {
    console.log('🧪 Testing Predictive Analytics Integration');
    console.log('==========================================');

    // Create a test authority user if it doesn't exist
    console.log('1. Setting up test authority user...');
    
    const testEmail = 'test.authority@tourease.com';
    const testPassword = 'TestPassword123!';
    
    // Check if user exists
    let testUser = await prisma.user.findUnique({
      where: { email: testEmail },
      include: { role: true }
    });

    if (!testUser) {
      // Get AUTHORITY role
      const authorityRole = await prisma.role.findUnique({
        where: { roleName: 'AUTHORITY' }
      });

      if (!authorityRole) {
        throw new Error('AUTHORITY role not found in database');
      }

      // Create test user
      const hashedPassword = await bcrypt.hash(testPassword, 10);
      testUser = await prisma.user.create({
        data: {
          username: 'test_authority',
          email: testEmail,
          password: hashedPassword,
          roleId: authorityRole.id
        },
        include: { role: true }
      });
      console.log('✅ Test authority user created');
    } else {
      console.log('✅ Test authority user already exists');
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: testUser.id, 
        email: testUser.email, 
        role: testUser.role.roleName 
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '1h' }
    );

    console.log('✅ JWT token generated');

    // Test the predictive analytics endpoint
    console.log('\n2. Testing predictive analytics endpoint...');
    
    const response = await axios.get('http://localhost:5003/api/authority/predictive-analytics', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const data = response.data;
    console.log('📊 Response status:', response.status);
    console.log('📊 Response data:', JSON.stringify(data, null, 2));

    if (response.status === 200 && data.success) {
      console.log('\n✅ Predictive analytics endpoint working correctly!');
      console.log('🔮 Received predictions:', data.data.predictions?.length || 0);
      console.log('📈 Received trend factors:', data.data.trendFactors?.length || 0);
      console.log('🎯 AI powered:', data.data.aiPowered);
    } else {
      console.log('\n❌ Predictive analytics endpoint failed');
      console.log('Error:', data.message || 'Unknown error');
    }

    // Test forecast accuracy endpoint
    console.log('\n3. Testing forecast accuracy endpoint...');
    
    const accuracyResponse = await axios.get('http://localhost:5003/api/authority/forecast-accuracy', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const accuracyData = accuracyResponse.data;
    console.log('📊 Accuracy response status:', accuracyResponse.status);
    console.log('📊 Accuracy response data:', JSON.stringify(accuracyData, null, 2));

    if (accuracyResponse.status === 200 && accuracyData.success) {
      console.log('\n✅ Forecast accuracy endpoint working correctly!');
      console.log('🎯 Overall accuracy:', accuracyData.data.overallAccuracy);
      console.log('📊 Historical data points:', accuracyData.data.historicalAccuracy?.length || 0);
    } else {
      console.log('\n❌ Forecast accuracy endpoint failed');
      console.log('Error:', accuracyData.message || 'Unknown error');
    }

    console.log('\n🎉 Test completed!');
    console.log('\nTest credentials for manual testing:');
    console.log('Email:', testEmail);
    console.log('Password:', testPassword);
    console.log('JWT Token:', token);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testPredictiveAnalytics();
