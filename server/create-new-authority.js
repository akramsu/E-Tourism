const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function createNewAuthority() {
  try {
    console.log('🔍 Creating new authority user...')
    
    // Get AUTHORITY role
    const authorityRole = await prisma.role.findFirst({
      where: { roleName: 'AUTHORITY' }
    })
    
    if (!authorityRole) {
      console.log('❌ AUTHORITY role not found')
      return
    }
    
    // Create unique username/email
    const timestamp = Date.now()
    const email = `authority${timestamp}@test.com`
    const username = `authority${timestamp}`
    
    const hashedPassword = await bcrypt.hash('password123', 10)
    
    const newUser = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
        roleId: authorityRole.id
      },
      include: {
        role: true
      }
    })
    
    console.log('✅ New authority user created!')
    console.log(`📧 Email: ${newUser.email}`)
    console.log(`🔑 Password: password123`)
    console.log(`👤 Username: ${newUser.username}`)
    console.log(`🎭 Role: ${newUser.role.roleName}`)
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createNewAuthority()
