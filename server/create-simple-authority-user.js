const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcrypt')

const prisma = new PrismaClient()

async function createAuthorityUser() {
  try {
    // Find the AUTHORITY role
    const authorityRole = await prisma.role.findUnique({
      where: { roleName: 'AUTHORITY' }
    })

    if (!authorityRole) {
      console.error('❌ AUTHORITY role not found')
      return
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: 'authority@tourease.com' }
    })

    if (existingUser) {
      console.log('✅ Authority user already exists')
      console.log('Email: authority@tourease.com')
      console.log('Password: authority123')
      return
    }

    // Hash password
    const hashedPassword = await bcrypt.hash('authority123', 10)

    // Create authority user
    const user = await prisma.user.create({
      data: {
        username: 'tourease_authority',
        email: 'authority@tourease.com',
        password: hashedPassword,
        phoneNumber: '+1234567890',
        birthDate: new Date('1985-06-15'),
        postcode: '12345',
        gender: 'prefer-not-to-say',
        roleId: authorityRole.id,
        createdDate: new Date()
      },
      include: {
        role: true
      }
    })

    console.log('✅ Authority user created successfully!')
    console.log('User ID:', user.id)
    console.log('Username:', user.username)
    console.log('Email:', user.email)
    console.log('Role:', user.role.roleName)
    console.log('Password: authority123')
    console.log('\n🔐 Login Credentials:')
    console.log('Email: authority@tourease.com')
    console.log('Password: authority123')

  } catch (error) {
    console.error('❌ Error creating authority user:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createAuthorityUser()
