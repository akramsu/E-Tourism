const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
})

// Test database connection
const connectDatabase = async () => {
  try {
    await prisma.$connect()
    console.log('✅ Database connected successfully')
    
    // Ensure roles exist
    await ensureRolesExist()
  } catch (error) {
    console.error('❌ Database connection failed:', error)
    process.exit(1)
  }
}

// Ensure default roles exist in the database
const ensureRolesExist = async () => {
  try {
    const roles = ['AUTHORITY', 'OWNER', 'TOURIST']
    
    for (const roleName of roles) {
      await prisma.role.upsert({
        where: { roleName },
        update: {},
        create: { roleName }
      })
    }
    
    console.log('✅ Default roles ensured in database')
  } catch (error) {
    console.error('❌ Error ensuring roles:', error)
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🔄 Shutting down gracefully...')
  await prisma.$disconnect()
  process.exit(0)
})

process.on('SIGTERM', async () => {
  console.log('\n🔄 Shutting down gracefully...')
  await prisma.$disconnect()
  process.exit(0)
})

module.exports = {
  prisma,
  connectDatabase
}
