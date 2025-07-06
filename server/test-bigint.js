// Test BigInt serialization fix
const { prisma } = require('./src/config/database')

// Helper function to convert BigInt values to numbers for JSON serialization
const convertBigIntToNumber = (obj) => {
  if (obj === null || obj === undefined) return obj
  if (typeof obj === 'bigint') return Number(obj)
  // Handle Prisma Decimal objects (check for toString method and specific structure)
  if (obj && typeof obj === 'object' && typeof obj.toString === 'function' && 
      obj.hasOwnProperty('s') && obj.hasOwnProperty('e') && obj.hasOwnProperty('d')) {
    return Number(obj.toString())
  }
  if (Array.isArray(obj)) return obj.map(convertBigIntToNumber)
  if (typeof obj === 'object') {
    const converted = {}
    for (const [key, value] of Object.entries(obj)) {
      converted[key] = convertBigIntToNumber(value)
    }
    return converted
  }
  return obj
}

async function testBigIntHandling() {
  console.log('🧪 Testing BigInt handling...')
  
  try {
    // Test query that returns BigInt
    const result = await prisma.$queryRaw`
      SELECT 
        COUNT(*) as count,
        SUM(COALESCE(amount, 0)) as revenue
      FROM visit 
      LIMIT 5
    `
    
    console.log('📊 Raw result:', result)
    console.log('📊 Type of count:', typeof result[0]?.count)
    console.log('📊 Type of revenue:', typeof result[0]?.revenue)
    console.log('📊 Revenue constructor:', result[0]?.revenue?.constructor?.name)
    console.log('📊 Revenue string value:', result[0]?.revenue?.toString())
    
    // Test conversion
    const converted = convertBigIntToNumber(result)
    console.log('🔄 Converted result:', converted)
    
    // Test JSON stringification
    try {
      const jsonString = JSON.stringify(converted)
      console.log('✅ JSON stringification successful, length:', jsonString.length)
      console.log('✅ JSON preview:', jsonString.substring(0, 100) + '...')
    } catch (error) {
      console.error('❌ JSON stringification failed:', error.message)
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

testBigIntHandling()
