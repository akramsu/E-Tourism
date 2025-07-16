-- Verify the image updates
SELECT attractionId, imageUrl 
FROM attraction_images 
WHERE attractionId <= 5 
ORDER BY attractionId, imageUrl;
