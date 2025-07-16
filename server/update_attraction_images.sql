-- 🖼️ UPDATE ATTRACTION IMAGES WITH WORKING URLs
-- This script replaces all broken image URLs with working ones

-- First, let's see what we're working with
SELECT COUNT(*) as total_images FROM attraction_images;

-- Update images for Attraction ID 1 (Museum/Cultural)
UPDATE attraction_images SET imageUrl = 'https://images.unsplash.com/photo-1518998053901-5348d3961a04?w=800&h=600&fit=crop' WHERE attractionId = 1 AND imageUrl LIKE '%sig=10%';
UPDATE attraction_images SET imageUrl = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=600&fit=crop' WHERE attractionId = 1 AND imageUrl LIKE '%sig=11%';
UPDATE attraction_images SET imageUrl = 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&h=600&fit=crop' WHERE attractionId = 1 AND imageUrl LIKE '%sig=12%';
UPDATE attraction_images SET imageUrl = 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop' WHERE attractionId = 1 AND imageUrl LIKE '%sig=13%';

-- Update images for Attraction ID 2 (Beach/Nature)
UPDATE attraction_images SET imageUrl = 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&h=600&fit=crop' WHERE attractionId = 2 AND imageUrl LIKE '%sig=20%';
UPDATE attraction_images SET imageUrl = 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&h=600&fit=crop' WHERE attractionId = 2 AND imageUrl LIKE '%sig=21%';
UPDATE attraction_images SET imageUrl = 'https://images.unsplash.com/photo-1471919743851-c4df8b6ee133?w=800&h=600&fit=crop' WHERE attractionId = 2 AND imageUrl LIKE '%sig=22%';
UPDATE attraction_images SET imageUrl = 'https://images.unsplash.com/photo-1586500036706-41963de24d8b?w=800&h=600&fit=crop' WHERE attractionId = 2 AND imageUrl LIKE '%sig=23%';
UPDATE attraction_images SET imageUrl = 'https://images.unsplash.com/photo-1544552866-d3ed42536cfd?w=800&h=600&fit=crop' WHERE attractionId = 2 AND imageUrl LIKE '%sig=24%';

-- Update images for Attraction ID 3 (Temple/Religious)
UPDATE attraction_images SET imageUrl = 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop' WHERE attractionId = 3 AND imageUrl LIKE '%sig=30%';
UPDATE attraction_images SET imageUrl = 'https://images.unsplash.com/photo-1555400082-8002d6903a97?w=800&h=600&fit=crop' WHERE attractionId = 3 AND imageUrl LIKE '%sig=31%';
UPDATE attraction_images SET imageUrl = 'https://images.unsplash.com/photo-1528127269322-539801943592?w=800&h=600&fit=crop' WHERE attractionId = 3 AND imageUrl LIKE '%sig=32%';
UPDATE attraction_images SET imageUrl = 'https://images.unsplash.com/photo-1520637836862-4d197d17c11a?w=800&h=600&fit=crop' WHERE attractionId = 3 AND imageUrl LIKE '%sig=33%';
UPDATE attraction_images SET imageUrl = 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&h=600&fit=crop' WHERE attractionId = 3 AND imageUrl LIKE '%sig=34%';

-- Update images for Attraction ID 4 (Adventure/Recreation)
UPDATE attraction_images SET imageUrl = 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop' WHERE attractionId = 4 AND imageUrl LIKE '%sig=40%';
UPDATE attraction_images SET imageUrl = 'https://images.unsplash.com/photo-1551524164-3ca4ac833fb5?w=800&h=600&fit=crop' WHERE attractionId = 4 AND imageUrl LIKE '%sig=41%';
UPDATE attraction_images SET imageUrl = 'https://images.unsplash.com/photo-1464822759844-d150312c65e4?w=800&h=600&fit=crop' WHERE attractionId = 4 AND imageUrl LIKE '%sig=42%';
UPDATE attraction_images SET imageUrl = 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&h=600&fit=crop' WHERE attractionId = 4 AND imageUrl LIKE '%sig=43%';
UPDATE attraction_images SET imageUrl = 'https://images.unsplash.com/photo-1414609245224-afa02bfb3fda?w=800&h=600&fit=crop' WHERE attractionId = 4 AND imageUrl LIKE '%sig=44%';

-- Update images for Attraction ID 5 (Urban/Modern)
UPDATE attraction_images SET imageUrl = 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800&h=600&fit=crop' WHERE attractionId = 5 AND imageUrl LIKE '%sig=50%';
UPDATE attraction_images SET imageUrl = 'https://images.unsplash.com/photo-1486299267070-83823f5448dd?w=800&h=600&fit=crop' WHERE attractionId = 5 AND imageUrl LIKE '%sig=51%';

-- For remaining attractions (6-120), let's use a rotation of Indonesian tourism images
-- Beaches and Islands
UPDATE attraction_images SET imageUrl = 'https://images.unsplash.com/photo-1537953773345-d172ccf13cf1?w=800&h=600&fit=crop' WHERE attractionId >= 6 AND attractionId <= 15 AND imageUrl LIKE '%sig=%0%';
UPDATE attraction_images SET imageUrl = 'https://images.unsplash.com/photo-1540979388789-6cee28a1cdc9?w=800&h=600&fit=crop' WHERE attractionId >= 6 AND attractionId <= 15 AND imageUrl LIKE '%sig=%1%';
UPDATE attraction_images SET imageUrl = 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&h=600&fit=crop' WHERE attractionId >= 6 AND attractionId <= 15 AND imageUrl LIKE '%sig=%2%';
UPDATE attraction_images SET imageUrl = 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop' WHERE attractionId >= 6 AND attractionId <= 15 AND imageUrl LIKE '%sig=%3%';
UPDATE attraction_images SET imageUrl = 'https://images.unsplash.com/photo-1544552866-d3ed42536cfd?w=800&h=600&fit=crop' WHERE attractionId >= 6 AND attractionId <= 15 AND imageUrl LIKE '%sig=%4%';

-- Mountains and Nature
UPDATE attraction_images SET imageUrl = 'https://images.unsplash.com/photo-1464822759844-d150312c65e4?w=800&h=600&fit=crop' WHERE attractionId >= 16 AND attractionId <= 25 AND imageUrl LIKE '%sig=%0%';
UPDATE attraction_images SET imageUrl = 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&h=600&fit=crop' WHERE attractionId >= 16 AND attractionId <= 25 AND imageUrl LIKE '%sig=%1%';
UPDATE attraction_images SET imageUrl = 'https://images.unsplash.com/photo-1414609245224-afa02bfb3fda?w=800&h=600&fit=crop' WHERE attractionId >= 16 AND attractionId <= 25 AND imageUrl LIKE '%sig=%2%';
UPDATE attraction_images SET imageUrl = 'https://images.unsplash.com/photo-1551524164-3ca4ac833fb5?w=800&h=600&fit=crop' WHERE attractionId >= 16 AND attractionId <= 25 AND imageUrl LIKE '%sig=%3%';
UPDATE attraction_images SET imageUrl = 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop' WHERE attractionId >= 16 AND attractionId <= 25 AND imageUrl LIKE '%sig=%4%';

-- Temples and Cultural Sites
UPDATE attraction_images SET imageUrl = 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop' WHERE attractionId >= 26 AND attractionId <= 35 AND imageUrl LIKE '%sig=%0%';
UPDATE attraction_images SET imageUrl = 'https://images.unsplash.com/photo-1555400082-8002d6903a97?w=800&h=600&fit=crop' WHERE attractionId >= 26 AND attractionId <= 35 AND imageUrl LIKE '%sig=%1%';
UPDATE attraction_images SET imageUrl = 'https://images.unsplash.com/photo-1528127269322-539801943592?w=800&h=600&fit=crop' WHERE attractionId >= 26 AND attractionId <= 35 AND imageUrl LIKE '%sig=%2%';
UPDATE attraction_images SET imageUrl = 'https://images.unsplash.com/photo-1520637836862-4d197d17c11a?w=800&h=600&fit=crop' WHERE attractionId >= 26 AND attractionId <= 35 AND imageUrl LIKE '%sig=%3%';
UPDATE attraction_images SET imageUrl = 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&h=600&fit=crop' WHERE attractionId >= 26 AND attractionId <= 35 AND imageUrl LIKE '%sig=%4%';

-- Museums and Buildings
UPDATE attraction_images SET imageUrl = 'https://images.unsplash.com/photo-1518998053901-5348d3961a04?w=800&h=600&fit=crop' WHERE attractionId >= 36 AND attractionId <= 45 AND imageUrl LIKE '%sig=%0%';
UPDATE attraction_images SET imageUrl = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=600&fit=crop' WHERE attractionId >= 36 AND attractionId <= 45 AND imageUrl LIKE '%sig=%1%';
UPDATE attraction_images SET imageUrl = 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800&h=600&fit=crop' WHERE attractionId >= 36 AND attractionId <= 45 AND imageUrl LIKE '%sig=%2%';
UPDATE attraction_images SET imageUrl = 'https://images.unsplash.com/photo-1486299267070-83823f5448dd?w=800&h=600&fit=crop' WHERE attractionId >= 36 AND attractionId <= 45 AND imageUrl LIKE '%sig=%3%';
UPDATE attraction_images SET imageUrl = 'https://images.unsplash.com/photo-1444084316824-dc26d6657664?w=800&h=600&fit=crop' WHERE attractionId >= 36 AND attractionId <= 45 AND imageUrl LIKE '%sig=%4%';

-- Parks and Gardens
UPDATE attraction_images SET imageUrl = 'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=800&h=600&fit=crop' WHERE attractionId >= 46 AND attractionId <= 55 AND imageUrl LIKE '%sig=%0%';
UPDATE attraction_images SET imageUrl = 'https://images.unsplash.com/photo-1441471349424-351990746ff4?w=800&h=600&fit=crop' WHERE attractionId >= 46 AND attractionId <= 55 AND imageUrl LIKE '%sig=%1%';
UPDATE attraction_images SET imageUrl = 'https://images.unsplash.com/photo-1518709268805-4e9042af2e04?w=800&h=600&fit=crop' WHERE attractionId >= 46 AND attractionId <= 55 AND imageUrl LIKE '%sig=%2%';
UPDATE attraction_images SET imageUrl = 'https://images.unsplash.com/photo-1520637836862-4d197d17c11a?w=800&h=600&fit=crop' WHERE attractionId >= 46 AND attractionId <= 55 AND imageUrl LIKE '%sig=%3%';
UPDATE attraction_images SET imageUrl = 'https://images.unsplash.com/photo-1507041957456-9c397ce39c97?w=800&h=600&fit=crop' WHERE attractionId >= 46 AND attractionId <= 55 AND imageUrl LIKE '%sig=%4%';

-- Waterfalls and Natural Wonders
UPDATE attraction_images SET imageUrl = 'https://images.unsplash.com/photo-1518709268805-4e9042af2e04?w=800&h=600&fit=crop' WHERE attractionId >= 56 AND attractionId <= 65 AND imageUrl LIKE '%sig=%0%';
UPDATE attraction_images SET imageUrl = 'https://images.unsplash.com/photo-1441471349424-351990746ff4?w=800&h=600&fit=crop' WHERE attractionId >= 56 AND attractionId <= 65 AND imageUrl LIKE '%sig=%1%';
UPDATE attraction_images SET imageUrl = 'https://images.unsplash.com/photo-1464822759844-d150312c65e4?w=800&h=600&fit=crop' WHERE attractionId >= 56 AND attractionId <= 65 AND imageUrl LIKE '%sig=%2%';
UPDATE attraction_images SET imageUrl = 'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=800&h=600&fit=crop' WHERE attractionId >= 56 AND attractionId <= 65 AND imageUrl LIKE '%sig=%3%';
UPDATE attraction_images SET imageUrl = 'https://images.unsplash.com/photo-1507041957456-9c397ce39c97?w=800&h=600&fit=crop' WHERE attractionId >= 56 AND attractionId <= 65 AND imageUrl LIKE '%sig=%4%';

-- Cities and Skylines
UPDATE attraction_images SET imageUrl = 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800&h=600&fit=crop' WHERE attractionId >= 66 AND attractionId <= 75 AND imageUrl LIKE '%sig=%0%';
UPDATE attraction_images SET imageUrl = 'https://images.unsplash.com/photo-1486299267070-83823f5448dd?w=800&h=600&fit=crop' WHERE attractionId >= 66 AND attractionId <= 75 AND imageUrl LIKE '%sig=%1%';
UPDATE attraction_images SET imageUrl = 'https://images.unsplash.com/photo-1444084316824-dc26d6657664?w=800&h=600&fit=crop' WHERE attractionId >= 66 AND attractionId <= 75 AND imageUrl LIKE '%sig=%2%';
UPDATE attraction_images SET imageUrl = 'https://images.unsplash.com/photo-1534430480872-3498386e7856?w=800&h=600&fit=crop' WHERE attractionId >= 66 AND attractionId <= 75 AND imageUrl LIKE '%sig=%3%';
UPDATE attraction_images SET imageUrl = 'https://images.unsplash.com/photo-1518709268805-4e9042af2e04?w=800&h=600&fit=crop' WHERE attractionId >= 66 AND attractionId <= 75 AND imageUrl LIKE '%sig=%4%';

-- Traditional Markets and Local Culture
UPDATE attraction_images SET imageUrl = 'https://images.unsplash.com/photo-1555400082-8002d6903a97?w=800&h=600&fit=crop' WHERE attractionId >= 76 AND attractionId <= 85 AND imageUrl LIKE '%sig=%0%';
UPDATE attraction_images SET imageUrl = 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop' WHERE attractionId >= 76 AND attractionId <= 85 AND imageUrl LIKE '%sig=%1%';
UPDATE attraction_images SET imageUrl = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=600&fit=crop' WHERE attractionId >= 76 AND attractionId <= 85 AND imageUrl LIKE '%sig=%2%';
UPDATE attraction_images SET imageUrl = 'https://images.unsplash.com/photo-1528127269322-539801943592?w=800&h=600&fit=crop' WHERE attractionId >= 76 AND attractionId <= 85 AND imageUrl LIKE '%sig=%3%';
UPDATE attraction_images SET imageUrl = 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&h=600&fit=crop' WHERE attractionId >= 76 AND attractionId <= 85 AND imageUrl LIKE '%sig=%4%';

-- Islands and Coastal Areas
UPDATE attraction_images SET imageUrl = 'https://images.unsplash.com/photo-1537953773345-d172ccf13cf1?w=800&h=600&fit=crop' WHERE attractionId >= 86 AND attractionId <= 95 AND imageUrl LIKE '%sig=%0%';
UPDATE attraction_images SET imageUrl = 'https://images.unsplash.com/photo-1540979388789-6cee28a1cdc9?w=800&h=600&fit=crop' WHERE attractionId >= 86 AND attractionId <= 95 AND imageUrl LIKE '%sig=%1%';
UPDATE attraction_images SET imageUrl = 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&h=600&fit=crop' WHERE attractionId >= 86 AND attractionId <= 95 AND imageUrl LIKE '%sig=%2%';
UPDATE attraction_images SET imageUrl = 'https://images.unsplash.com/photo-1544552866-d3ed42536cfd?w=800&h=600&fit=crop' WHERE attractionId >= 86 AND attractionId <= 95 AND imageUrl LIKE '%sig=%3%';
UPDATE attraction_images SET imageUrl = 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&h=600&fit=crop' WHERE attractionId >= 86 AND attractionId <= 95 AND imageUrl LIKE '%sig=%4%';

-- Adventure Sports and Activities
UPDATE attraction_images SET imageUrl = 'https://images.unsplash.com/photo-1551524164-3ca4ac833fb5?w=800&h=600&fit=crop' WHERE attractionId >= 96 AND attractionId <= 105 AND imageUrl LIKE '%sig=%0%';
UPDATE attraction_images SET imageUrl = 'https://images.unsplash.com/photo-1464822759844-d150312c65e4?w=800&h=600&fit=crop' WHERE attractionId >= 96 AND attractionId <= 105 AND imageUrl LIKE '%sig=%1%';
UPDATE attraction_images SET imageUrl = 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&h=600&fit=crop' WHERE attractionId >= 96 AND attractionId <= 105 AND imageUrl LIKE '%sig=%2%';
UPDATE attraction_images SET imageUrl = 'https://images.unsplash.com/photo-1414609245224-afa02bfb3fda?w=800&h=600&fit=crop' WHERE attractionId >= 96 AND attractionId <= 105 AND imageUrl LIKE '%sig=%3%';
UPDATE attraction_images SET imageUrl = 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop' WHERE attractionId >= 96 AND attractionId <= 105 AND imageUrl LIKE '%sig=%4%';

-- Historical Sites and Monuments
UPDATE attraction_images SET imageUrl = 'https://images.unsplash.com/photo-1520637836862-4d197d17c11a?w=800&h=600&fit=crop' WHERE attractionId >= 106 AND attractionId <= 115 AND imageUrl LIKE '%sig=%0%';
UPDATE attraction_images SET imageUrl = 'https://images.unsplash.com/photo-1555400082-8002d6903a97?w=800&h=600&fit=crop' WHERE attractionId >= 106 AND attractionId <= 115 AND imageUrl LIKE '%sig=%1%';
UPDATE attraction_images SET imageUrl = 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop' WHERE attractionId >= 106 AND attractionId <= 115 AND imageUrl LIKE '%sig=%2%';
UPDATE attraction_images SET imageUrl = 'https://images.unsplash.com/photo-1518998053901-5348d3961a04?w=800&h=600&fit=crop' WHERE attractionId >= 106 AND attractionId <= 115 AND imageUrl LIKE '%sig=%3%';
UPDATE attraction_images SET imageUrl = 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&h=600&fit=crop' WHERE attractionId >= 106 AND attractionId <= 115 AND imageUrl LIKE '%sig=%4%';

-- Entertainment and Modern Attractions
UPDATE attraction_images SET imageUrl = 'https://images.unsplash.com/photo-1534430480872-3498386e7856?w=800&h=600&fit=crop' WHERE attractionId >= 116 AND attractionId <= 120 AND imageUrl LIKE '%sig=%0%';
UPDATE attraction_images SET imageUrl = 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800&h=600&fit=crop' WHERE attractionId >= 116 AND attractionId <= 120 AND imageUrl LIKE '%sig=%1%';
UPDATE attraction_images SET imageUrl = 'https://images.unsplash.com/photo-1486299267070-83823f5448dd?w=800&h=600&fit=crop' WHERE attractionId >= 116 AND attractionId <= 120 AND imageUrl LIKE '%sig=%2%';
UPDATE attraction_images SET imageUrl = 'https://images.unsplash.com/photo-1444084316824-dc26d6657664?w=800&h=600&fit=crop' WHERE attractionId >= 116 AND attractionId <= 120 AND imageUrl LIKE '%sig=%3%';
UPDATE attraction_images SET imageUrl = 'https://images.unsplash.com/photo-1518709268805-4e9042af2e04?w=800&h=600&fit=crop' WHERE attractionId >= 116 AND attractionId <= 120 AND imageUrl LIKE '%sig=%4%';

-- Update any remaining broken URLs with a fallback approach
UPDATE attraction_images 
SET imageUrl = CASE 
    WHEN attractionId % 20 = 1 THEN 'https://images.unsplash.com/photo-1537953773345-d172ccf13cf1?w=800&h=600&fit=crop'
    WHEN attractionId % 20 = 2 THEN 'https://images.unsplash.com/photo-1540979388789-6cee28a1cdc9?w=800&h=600&fit=crop'
    WHEN attractionId % 20 = 3 THEN 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&h=600&fit=crop'
    WHEN attractionId % 20 = 4 THEN 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop'
    WHEN attractionId % 20 = 5 THEN 'https://images.unsplash.com/photo-1555400082-8002d6903a97?w=800&h=600&fit=crop'
    WHEN attractionId % 20 = 6 THEN 'https://images.unsplash.com/photo-1528127269322-539801943592?w=800&h=600&fit=crop'
    WHEN attractionId % 20 = 7 THEN 'https://images.unsplash.com/photo-1520637836862-4d197d17c11a?w=800&h=600&fit=crop'
    WHEN attractionId % 20 = 8 THEN 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop'
    WHEN attractionId % 20 = 9 THEN 'https://images.unsplash.com/photo-1551524164-3ca4ac833fb5?w=800&h=600&fit=crop'
    WHEN attractionId % 20 = 10 THEN 'https://images.unsplash.com/photo-1464822759844-d150312c65e4?w=800&h=600&fit=crop'
    WHEN attractionId % 20 = 11 THEN 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&h=600&fit=crop'
    WHEN attractionId % 20 = 12 THEN 'https://images.unsplash.com/photo-1414609245224-afa02bfb3fda?w=800&h=600&fit=crop'
    WHEN attractionId % 20 = 13 THEN 'https://images.unsplash.com/photo-1518998053901-5348d3961a04?w=800&h=600&fit=crop'
    WHEN attractionId % 20 = 14 THEN 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=600&fit=crop'
    WHEN attractionId % 20 = 15 THEN 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800&h=600&fit=crop'
    WHEN attractionId % 20 = 16 THEN 'https://images.unsplash.com/photo-1486299267070-83823f5448dd?w=800&h=600&fit=crop'
    WHEN attractionId % 20 = 17 THEN 'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=800&h=600&fit=crop'
    WHEN attractionId % 20 = 18 THEN 'https://images.unsplash.com/photo-1441471349424-351990746ff4?w=800&h=600&fit=crop'
    WHEN attractionId % 20 = 19 THEN 'https://images.unsplash.com/photo-1518709268805-4e9042af2e04?w=800&h=600&fit=crop'
    ELSE 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&h=600&fit=crop'
END
WHERE imageUrl LIKE '%source.unsplash.com%';

-- Verify the update
SELECT attractionId, COUNT(*) as image_count, 
       GROUP_CONCAT(SUBSTRING(imageUrl, 1, 50)) as sample_urls
FROM attraction_images 
GROUP BY attractionId 
ORDER BY attractionId 
LIMIT 10;

-- Show total updated
SELECT COUNT(*) as total_updated FROM attraction_images WHERE imageUrl LIKE '%images.unsplash.com%';
