-- 🚀 QUICK FIX: Replace all broken image URLs with working ones
-- This is a simple one-command fix for all attraction images

-- Replace all source.unsplash.com URLs with working images.unsplash.com URLs
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
