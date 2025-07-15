const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function checkUsers() {
  try {
    console.log('🔍 Checking for authority users...')
    
    const authorityUsers = await prisma.user.findMany({
      where: {
        email: {
          contains: 'authority'
        }
      },
      include: {
        role: true
      }
    })
    
    console.log('Authority users found:', authorityUsers.length)
    for (const user of authorityUsers) {
      console.log(`- Email: ${user.email}, Username: ${user.username}, Role: ${user.role.roleName}`)
    }
    
    // Let's also check all users to see what exists
    const allUsers = await prisma.user.findMany({
      include: { role: true },
      take: 5 // Just first 5
    })
    
    console.log('\nFirst 5 users in database:')
    for (const user of allUsers) {
      console.log(`- Email: ${user.email}, Username: ${user.username}, Role: ${user.role.roleName}`)
      
      // For the first authority user, let's test password
      if (user.role.roleName === 'AUTHORITY') {
        console.log(`  Testing password for ${user.email}...`)
        const isMatch1 = await bcrypt.compare('testpass123', user.password)
        const isMatch2 = await bcrypt.compare('password123', user.password)
        const isMatch3 = await bcrypt.compare('admin123', user.password)
        console.log(`  - testpass123: ${isMatch1}`)
        console.log(`  - password123: ${isMatch2}`)
        console.log(`  - admin123: ${isMatch3}`)
        break
      }
    }
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkUsers()
