const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function createTestAuthority() {
  try {
    console.log('🔍 Checking for existing test authority...')
    
    // Check if authority role exists
    let authorityRole = await prisma.role.findFirst({
      where: { roleName: 'AUTHORITY' }
    })
    
    if (!authorityRole) {
      console.log('📝 Creating AUTHORITY role...')
      authorityRole = await prisma.role.create({
        data: { roleName: 'AUTHORITY' }
      })
    }
    
    // Check if test authority user exists
    const existingUser = await prisma.user.findFirst({
      where: { email: 'authority@test.com' }
    })
    
    if (existingUser) {
      console.log('✅ Test authority user already exists: authority@test.com')
      return existingUser
    }
    
    // Create test authority user
    const hashedPassword = await bcrypt.hash('testpass123', 10)
    
    const testAuthority = await prisma.user.create({
      data: {
        username: 'testauthority',
        email: 'authority@test.com',
        password: hashedPassword,
        roleId: authorityRole.id
      },
      include: {
        role: true
      }
    })
    
    console.log('✅ Test authority user created successfully!')
    console.log(`📧 Email: authority@test.com`)
    console.log(`🔑 Password: testpass123`)
    console.log(`👤 Username: testauthority`)
    console.log(`🏛️ Role: ${testAuthority.role.roleName}`)
    
    return testAuthority
    
  } catch (error) {
    console.error('❌ Error creating test authority:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createTestAuthority()
