// Create authority user directly in database
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createAuthorityUser() {
  try {
    console.log('🔧 Creating authority user directly in database...');

    // Hash password
    const hashedPassword = await bcrypt.hash('admin123', 10);

    // Get AUTHORITY role
    const authorityRole = await prisma.role.findFirst({
      where: { roleName: 'AUTHORITY' }
    });

    if (!authorityRole) {
      console.log('❌ AUTHORITY role not found in database');
      return;
    }

    // Check if authority user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username: 'authority' },
          { email: 'authority@tourease.com' }
        ]
      }
    });

    if (existingUser) {
      console.log('✅ Authority user already exists');
      console.log('Username: authority');
      console.log('Password: admin123');
      console.log('Email:', existingUser.email);
      return;
    }

    // Create authority user
    const authorityUser = await prisma.user.create({
      data: {
        username: 'authority',
        email: 'authority@tourease.com',
        password: hashedPassword,
        phoneNumber: '+1234567890',
        postcode: '12345',
        roleId: authorityRole.id
      },
      include: {
        role: true
      }
    });

    console.log('✅ Authority user created successfully!');
    console.log('Username: authority');
    console.log('Password: admin123');
    console.log('Email: authority@tourease.com');
    console.log('Role:', authorityUser.role.roleName);

  } catch (error) {
    console.error('❌ Error creating authority user:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createAuthorityUser();
