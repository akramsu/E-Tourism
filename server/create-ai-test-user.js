const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function createTestUser() {
  try {
    console.log('🔐 Creating test user for AI chat testing...');
    
    // Get TOURIST role
    const touristRole = await prisma.role.findFirst({
      where: { roleName: 'TOURIST' }
    });
    
    if (!touristRole) {
      console.error('❌ TOURIST role not found');
      return;
    }
    
    // Check if test user already exists
    const existingUser = await prisma.user.findFirst({
      where: { email: 'aichattest@test.com' }
    });
    
    if (existingUser) {
      console.log('✅ Test user already exists');
      console.log('📧 Email: aichattest@test.com');
      console.log('🔑 Password: TestPassword123!');
      await prisma.$disconnect();
      return;
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash('TestPassword123!', 10);
    
    // Create test user
    const testUser = await prisma.user.create({
      data: {
        username: 'aichattest',
        email: 'aichattest@test.com',
        password: hashedPassword,
        phoneNumber: '+1234567890',
        birthDate: new Date('1990-01-01'),
        postcode: '12345',
        gender: 'MALE',
        roleId: touristRole.id,
        createdDate: new Date()
      }
    });
    
    console.log('✅ Test user created successfully!');
    console.log('📧 Email: aichattest@test.com');
    console.log('🔑 Password: TestPassword123!');
    console.log('👤 User ID:', testUser.id);
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Error creating test user:', error.message);
    await prisma.$disconnect();
  }
}

createTestUser();
