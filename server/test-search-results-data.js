const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testSearchResultsData() {
    console.log('🔍 Testing Search Results Data Structure...\n');

    try {
        // Simulate the getFeaturedAttractions API call
        const attractions = await prisma.attraction.findMany({
            include: {
                images: {
                    take: 1 // Only first image for featured display
                },
                _count: {
                    select: { visits: true }
                }
            },
            orderBy: [
                { rating: 'desc' },
                { createdDate: 'desc' }
            ],
            take: 5 // Sample data
        });

        const transformedAttractions = attractions.map(attraction => ({
            ...attraction,
            price: attraction.price ? parseFloat(attraction.price) : 0,
            totalVisits: attraction._count.visits,
            image: attraction.images[0]?.imageUrl || null
        }));

        console.log('📊 Sample API Response Structure:');
        console.log('='.repeat(60));
        
        if (transformedAttractions.length > 0) {
            const sample = transformedAttractions[0];
            console.log(`🏛️  Attraction: ${sample.name}`);
            console.log(`📍 Address: ${sample.address}`);
            console.log(`🏷️  Category: ${sample.category}`);
            console.log(`⭐ Rating: ${sample.rating}`);
            console.log(`👥 Total Visits: ${sample.totalVisits}`);
            console.log(`💰 Price: ${sample.price}`);
            console.log(`📸 Image URL: ${sample.image}`);
            console.log(`📝 Description: ${sample.description?.substring(0, 100)}...`);
            
            console.log('\n🔗 Checking Image URLs:');
            console.log('='.repeat(60));
            
            transformedAttractions.slice(0, 3).forEach((attraction, index) => {
                console.log(`${index + 1}. ${attraction.name}`);
                console.log(`   Image: ${attraction.image || 'No image'}`);
                console.log(`   Original images array: ${JSON.stringify(attraction.images)}`);
                console.log('');
            });
            
            // Check image URL quality
            const imageStats = transformedAttractions.reduce((stats, attraction) => {
                if (attraction.image) {
                    if (attraction.image.includes('images.unsplash.com')) {
                        stats.unsplash++;
                        if (attraction.image.includes('w=800') && attraction.image.includes('h=600')) {
                            stats.highQuality++;
                        }
                    }
                    stats.total++;
                }
                return stats;
            }, { total: 0, unsplash: 0, highQuality: 0 });
            
            console.log('📊 Image Quality Statistics:');
            console.log('='.repeat(60));
            console.log(`Total images: ${imageStats.total}`);
            console.log(`Unsplash images: ${imageStats.unsplash}`);
            console.log(`High quality (800x600): ${imageStats.highQuality}`);
            console.log(`Quality percentage: ${Math.round((imageStats.highQuality / imageStats.total) * 100)}%`);
        }

        console.log('\n✅ Search Results Data Test Complete!');
        
    } catch (error) {
        console.error('❌ Error testing search results data:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

testSearchResultsData();
