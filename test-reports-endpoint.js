const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();

async function testReportsEndpoint() {
  try {
    console.log('🔍 Checking existing authority users...');
    
    // Find an authority user
    const authorities = await prisma.user.findMany({
      where: {
        role: {
          roleName: 'AUTHORITY'
        }
      },
      include: {
        role: true
      },
      take: 5
    });

    console.log(`Found ${authorities.length} authority users:`);
    authorities.forEach(user => {
      console.log(`- ID: ${user.id}, Email: ${user.email}, Username: ${user.username}`);
    });

    if (authorities.length === 0) {
      console.log('❌ No authority users found. Creating one...');
      
      // Create an authority user
      const hashedPassword = await bcrypt.hash('test123', 10);
      const authorityRole = await prisma.role.findUnique({
        where: { roleName: 'AUTHORITY' }
      });

      if (!authorityRole) {
        console.error('❌ AUTHORITY role not found');
        return;
      }

      const newUser = await prisma.user.create({
        data: {
          email: 'test.authority@tourease.com',
          username: 'testauthority',
          password: hashedPassword,
          roleId: authorityRole.id,
          isVerified: true
        },
        include: {
          role: true
        }
      });

      console.log('✅ Created test authority user:', newUser.email);
      authorities.push(newUser);
    }

    // Use the first authority user
    const testUser = authorities[0];
    console.log(`\n🔑 Using user: ${testUser.email}`);

    // Test login
    console.log('\n📡 Testing login...');
    const loginResponse = await fetch('http://localhost:5003/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: testUser.email,
        password: 'test123' // Try common password
      })
    });

    if (!loginResponse.ok) {
      // Try different password
      console.log('First password failed, trying "password123"...');
      const loginResponse2 = await fetch('http://localhost:5003/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: testUser.email,
          password: 'password123'
        })
      });

      if (!loginResponse2.ok) {
        const errorText = await loginResponse2.text();
        console.error('❌ Login failed:', errorText);
        
        // Update the user's password to a known value
        console.log('🔧 Updating password to "test123"...');
        const hashedPassword = await bcrypt.hash('test123', 10);
        await prisma.user.update({
          where: { id: testUser.id },
          data: { password: hashedPassword }
        });
        
        // Try login again
        const loginResponse3 = await fetch('http://localhost:5003/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email: testUser.email,
            password: 'test123'
          })
        });

        if (!loginResponse3.ok) {
          const errorText3 = await loginResponse3.text();
          console.error('❌ Login still failed:', errorText3);
          return;
        }

        const loginData3 = await loginResponse3.json();
        console.log('✅ Login successful after password update');
        
        // Test reports endpoint
        await testReports(loginData3.token);
        return;
      }

      const loginData2 = await loginResponse2.json();
      console.log('✅ Login successful with password123');
      
      // Test reports endpoint
      await testReports(loginData2.token);
      return;
    }

    const loginData = await loginResponse.json();
    console.log('✅ Login successful with test123');
    
    // Test reports endpoint
    await testReports(loginData.token);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function testReports(token) {
  console.log('\n📊 Testing reports endpoint...');
  
  try {
    const reportsResponse = await fetch('http://localhost:5003/api/authority/reports', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log(`Reports response status: ${reportsResponse.status}`);
    
    if (!reportsResponse.ok) {
      const errorText = await reportsResponse.text();
      console.error('❌ Reports endpoint failed:', errorText);
      return;
    }

    const reportsData = await reportsResponse.json();
    console.log('✅ Reports endpoint successful');
    console.log('Reports data:', JSON.stringify(reportsData, null, 2));

    // Test other endpoints
    console.log('\n📈 Testing report stats endpoint...');
    const statsResponse = await fetch('http://localhost:5003/api/authority/reports/stats', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (statsResponse.ok) {
      const statsData = await statsResponse.json();
      console.log('✅ Report stats endpoint successful');
      console.log('Stats data:', JSON.stringify(statsData, null, 2));
    } else {
      const errorText = await statsResponse.text();
      console.log('❌ Report stats failed:', errorText);
    }

    console.log('\n📋 Testing report templates endpoint...');
    const templatesResponse = await fetch('http://localhost:5003/api/authority/reports/templates', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (templatesResponse.ok) {
      const templatesData = await templatesResponse.json();
      console.log('✅ Report templates endpoint successful');
      console.log('Templates data:', JSON.stringify(templatesData, null, 2));
    } else {
      const errorText = await templatesResponse.text();
      console.log('❌ Report templates failed:', errorText);
    }

  } catch (error) {
    console.error('❌ Error testing reports:', error);
  }
}

testReportsEndpoint();
