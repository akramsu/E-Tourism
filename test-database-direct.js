const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testDatabaseDirect() {
  try {
    console.log('Testing direct database access for profile images...\n');

    // Find users with profile pictures
    const usersWithImages = await prisma.user.findMany({
      where: {
        profilePicture: {
          not: null
        }
      },
      select: {
        id: true,
        username: true,
        email: true,
        profilePicture: true,
        createdDate: true
      }
    });

    console.log(`Found ${usersWithImages.length} users with profile pictures:`);
    
    usersWithImages.forEach((user, index) => {
      console.log(`\n${index + 1}. User ID: ${user.id}`);
      console.log(`   Username: ${user.username}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Created: ${user.createdDate}`);
      console.log(`   Profile Picture:`, {
        hasImage: !!user.profilePicture,
        length: user.profilePicture ? user.profilePicture.length : 0,
        sizeKB: user.profilePicture ? Math.round(user.profilePicture.length / 1024) : 0,
        preview: user.profilePicture ? user.profilePicture.substring(0, 50) + '...' : 'none',
        isValidBase64: user.profilePicture ? user.profilePicture.startsWith('data:image/') : false
      });
    });

    // Test creating a new user with profile picture
    console.log('\n\n🔬 Testing direct database insert with profile image...');
    
    const testImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
    
    // First, check if test user already exists
    const existingTestUser = await prisma.user.findUnique({
      where: { email: 'dbtest@test.com' }
    });

    if (existingTestUser) {
      console.log('Test user already exists, updating...');
      const updatedUser = await prisma.user.update({
        where: { id: existingTestUser.id },
        data: {
          profilePicture: testImage
        },
        select: {
          id: true,
          username: true,
          email: true,
          profilePicture: true
        }
      });
      
      console.log('Updated user:', {
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
        hasProfilePicture: !!updatedUser.profilePicture,
        profilePictureSize: updatedUser.profilePicture ? `${Math.round(updatedUser.profilePicture.length / 1024)}KB` : 'none'
      });
    } else {
      console.log('Creating new test user...');
      const newUser = await prisma.user.create({
        data: {
          username: 'dbtest',
          email: 'dbtest@test.com',
          password: '$2b$10$example.hash.for.testing',
          roleId: 3,
          profilePicture: testImage
        },
        select: {
          id: true,
          username: true,
          email: true,
          profilePicture: true
        }
      });
      
      console.log('Created new user:', {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        hasProfilePicture: !!newUser.profilePicture,
        profilePictureSize: newUser.profilePicture ? `${Math.round(newUser.profilePicture.length / 1024)}KB` : 'none'
      });
    }

    // Verify the save worked by querying again
    console.log('\n🔍 Verifying the direct database save...');
    const verifyUser = await prisma.user.findUnique({
      where: { email: 'dbtest@test.com' },
      select: {
        id: true,
        username: true,
        email: true,
        profilePicture: true
      }
    });

    if (verifyUser) {
      console.log('Verification result:', {
        id: verifyUser.id,
        username: verifyUser.username,
        email: verifyUser.email,
        hasProfilePicture: !!verifyUser.profilePicture,
        profilePictureSize: verifyUser.profilePicture ? `${Math.round(verifyUser.profilePicture.length / 1024)}KB` : 'none',
        profilePictureValid: verifyUser.profilePicture ? verifyUser.profilePicture.startsWith('data:image/') : false
      });
    }

  } catch (error) {
    console.error('Database test error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testDatabaseDirect();
