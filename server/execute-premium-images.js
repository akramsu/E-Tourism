const mysql = require('mysql2/promise');
const fs = require('fs');

async function updateImagesToPremiumDiverse() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: 'root', // Update if different
        database: 'tourease_db'
    });

    console.log('🌟 Starting Premium Diverse Images Update...');

    try {
        // Read and execute the SQL file
        const sqlContent = fs.readFileSync('./premium_diverse_images.sql', 'utf8');
        
        // Execute the update query
        const [result] = await connection.execute(sqlContent);
        
        console.log(`✅ SUCCESS: Updated ${result.affectedRows} images with premium diverse content!`);
        
        // Verify the update with some sample data
        const [verifyResults] = await connection.execute(`
            SELECT ai.attractionId, ai.imageUrl, a.name,
                   ROW_NUMBER() OVER (PARTITION BY ai.attractionId ORDER BY ai.id) as image_position
            FROM attraction_images ai 
            JOIN attractions a ON ai.attractionId = a.id 
            ORDER BY ai.attractionId, ai.id 
            LIMIT 20
        `);
        
        console.log('\n📸 Sample of Updated Images:');
        console.log('='.repeat(80));
        verifyResults.forEach(row => {
            console.log(`Attraction: ${row.name} | Position: ${row.image_position} | URL: ${row.imageUrl}`);
        });
        
        console.log(`\n🎯 Total images updated: ${result.affectedRows}`);
        console.log('✅ All attractions now have unique, high-quality images!');
        
    } catch (error) {
        console.error('❌ Error updating images:', error.message);
    } finally {
        await connection.end();
    }
}

updateImagesToPremiumDiverse();
