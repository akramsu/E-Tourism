const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkImages() {
  try {
    console.log('🔍 Checking updated image URLs...\n')
    
    // Get a sample of images
    const images = await prisma.attractionImage.findMany({
      take: 10,
      orderBy: { attractionId: 'asc' },
      select: {
        attractionId: true,
        imageUrl: true
      }
    })
    
    console.log('📸 Sample updated image URLs:')
    images.forEach((img, index) => {
      console.log(`${index + 1}. Attraction ${img.attractionId}: ${img.imageUrl}`)
    })
    
    // Count total images
    const totalCount = await prisma.attractionImage.count()
    console.log(`\n✅ Total images in database: ${totalCount}`)
    
    // Count working images
    const workingCount = await prisma.attractionImage.count({
      where: {
        imageUrl: {
          contains: 'images.unsplash.com'
        }
      }
    })
    console.log(`✅ Images using working URLs: ${workingCount}`)
    
    // Count broken images
    const brokenCount = await prisma.attractionImage.count({
      where: {
        imageUrl: {
          contains: 'source.unsplash.com'
        }
      }
    })
    console.log(`❌ Images still using broken URLs: ${brokenCount}`)
    
    if (brokenCount === 0) {
      console.log('\n🎉 SUCCESS: All image URLs have been updated to working links!')
    } else {
      console.log(`\n⚠️  WARNING: ${brokenCount} images still need to be updated`)
    }
    
  } catch (error) {
    console.error('Error checking images:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkImages()
