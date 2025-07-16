const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createCompleteAuthorityUser() {
  try {
    console.log('🔐 Creating complete authority user...');

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: 'authority@gmail.com' }
    });

    if (existingUser) {
      console.log('❌ User with email authority@gmail.com already exists');
      return;
    }

    // Get the Authority role
    const authorityRole = await prisma.role.findFirst({
      where: { roleName: 'AUTHORITY' }
    });

    if (!authorityRole) {
      console.log('❌ Authority role not found');
      return;
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash('authority', 10);

    // Create sample profile picture (a simple base64 encoded 1x1 pixel PNG)
    const sampleProfilePicture = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

    // Create the complete authority user
    const newUser = await prisma.user.create({
      data: {
        username: 'authority_complete',
        email: 'authority@gmail.com',
        password: hashedPassword,
        phoneNumber: '+1-555-0123',
        birthDate: new Date('1985-03-15'), // March 15, 1985
        postcode: '12345',
        gender: 'female',
        profilePicture: sampleProfilePicture,
        roleId: authorityRole.id,
        createdDate: new Date()
      },
      include: {
        role: true
      }
    });

    console.log('✅ Authority user created successfully!');
    console.log('📋 User Details:');
    console.log(`   Email: ${newUser.email}`);
    console.log(`   Password: authority`);
    console.log(`   Username: ${newUser.username}`);
    console.log(`   Phone: ${newUser.phoneNumber}`);
    console.log(`   Birth Date: ${newUser.birthDate?.toISOString().split('T')[0]}`);
    console.log(`   Postcode: ${newUser.postcode}`);
    console.log(`   Gender: ${newUser.gender}`);
    console.log(`   Role: ${newUser.role.roleName}`);
    console.log(`   Profile Picture: ${newUser.profilePicture ? 'Yes (Base64 image)' : 'No'}`);
    console.log(`   Created: ${newUser.createdDate.toISOString()}`);
    console.log(`   User ID: ${newUser.id}`);

  } catch (error) {
    console.error('❌ Error creating authority user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createCompleteAuthorityUser();
