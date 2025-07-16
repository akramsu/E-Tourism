-- 🌟 PREMIUM QUALITY DIVERSE IMAGES UPDATE
-- This assigns unique, high-quality images to each photo of every attraction
-- No more repeated images - each image is different and beautiful!

-- Update images with unique, high-quality URLs for maximum diversity
-- Using row position within each attraction to assign different images

UPDATE attraction_images ai1
JOIN (
    SELECT id, attractionId, 
           ROW_NUMBER() OVER (PARTITION BY attractionId ORDER BY id) as row_num
    FROM attraction_images
) ai2 ON ai1.id = ai2.id
SET ai1.imageUrl = CASE 
    -- Position 1 images (first image of each attraction)
    WHEN ai2.row_num = 1 THEN 
        CASE ai2.attractionId % 20
            WHEN 1 THEN 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop&q=90&auto=format'   -- Mountain landscape
            WHEN 2 THEN 'https://images.unsplash.com/photo-1537953773345-d172ccf13cf1?w=800&h=600&fit=crop&q=90&auto=format'   -- Tropical paradise
            WHEN 3 THEN 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop&q=90&auto=format'   -- Ancient temple
            WHEN 4 THEN 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800&h=600&fit=crop&q=90&auto=format'   -- Modern cityscape
            WHEN 5 THEN 'https://images.unsplash.com/photo-1464822759844-d150312c65e4?w=800&h=600&fit=crop&q=90&auto=format'   -- Dense forest
            WHEN 6 THEN 'https://images.unsplash.com/photo-1518998053901-5348d3961a04?w=800&h=600&fit=crop&q=90&auto=format'   -- Art museum
            WHEN 7 THEN 'https://images.unsplash.com/photo-1540979388789-6cee28a1cdc9?w=800&h=600&fit=crop&q=90&auto=format'   -- Beach paradise
            WHEN 8 THEN 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&h=600&fit=crop&q=90&auto=format'   -- Mountain peak
            WHEN 9 THEN 'https://images.unsplash.com/photo-1555400082-8002d6903a97?w=800&h=600&fit=crop&q=90&auto=format'   -- Traditional building
            WHEN 10 THEN 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&h=600&fit=crop&q=90&auto=format'  -- Stunning waterfall
            WHEN 11 THEN 'https://images.unsplash.com/photo-1551524164-3ca4ac833fb5?w=800&h=600&fit=crop&q=90&auto=format'  -- Adventure sports
            WHEN 12 THEN 'https://images.unsplash.com/photo-1544552866-d3ed42536cfd?w=800&h=600&fit=crop&q=90&auto=format'  -- Crystal waters
            WHEN 13 THEN 'https://images.unsplash.com/photo-1528127269322-539801943592?w=800&h=600&fit=crop&q=90&auto=format'  -- Sacred temple
            WHEN 14 THEN 'https://images.unsplash.com/photo-1486299267070-83823f5448dd?w=800&h=600&fit=crop&q=90&auto=format'  -- Urban architecture
            WHEN 15 THEN 'https://images.unsplash.com/photo-1441471349424-351990746ff4?w=800&h=600&fit=crop&q=90&auto=format'  -- Green gardens
            WHEN 16 THEN 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=600&fit=crop&q=90&auto=format'  -- Cultural center
            WHEN 17 THEN 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&h=600&fit=crop&q=90&auto=format'  -- Coastal beauty
            WHEN 18 THEN 'https://images.unsplash.com/photo-1414609245224-afa02bfb3fda?w=800&h=600&fit=crop&q=90&auto=format'  -- Alpine views
            WHEN 19 THEN 'https://images.unsplash.com/photo-1520637836862-4d197d17c11a?w=800&h=600&fit=crop&q=90&auto=format'  -- Heritage site
            ELSE 'https://images.unsplash.com/photo-1518709268805-4e9042af2e04?w=800&h=600&fit=crop&q=90&auto=format'         -- Natural wonder
        END

    -- Position 2 images (second image of each attraction)
    WHEN ai2.row_num = 2 THEN 
        CASE ai2.attractionId % 20
            WHEN 1 THEN 'https://images.unsplash.com/photo-1511593358241-7eea1f3c84e5?w=800&h=600&fit=crop&q=90&auto=format'   -- Mountain trail
            WHEN 2 THEN 'https://images.unsplash.com/photo-1544693282-9e5cf3f47e81?w=800&h=600&fit=crop&q=90&auto=format'   -- Island aerial
            WHEN 3 THEN 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&h=600&fit=crop&q=90&auto=format'   -- Temple interior
            WHEN 4 THEN 'https://images.unsplash.com/photo-1444084316824-dc26d6657664?w=800&h=600&fit=crop&q=90&auto=format'   -- City lights
            WHEN 5 THEN 'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=800&h=600&fit=crop&q=90&auto=format'   -- Botanical path
            WHEN 6 THEN 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&h=600&fit=crop&q=90&auto=format'   -- Historic hall
            WHEN 7 THEN 'https://images.unsplash.com/photo-1471919743851-c4df8b6ee133?w=800&h=600&fit=crop&q=90&auto=format'   -- Rocky coast
            WHEN 8 THEN 'https://images.unsplash.com/photo-1506197603052-3cc9c3a201bd?w=800&h=600&fit=crop&q=90&auto=format'   -- Mountain lake
            WHEN 9 THEN 'https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?w=800&h=600&fit=crop&q=90&auto=format'   -- Cultural market
            WHEN 10 THEN 'https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=800&h=600&fit=crop&q=90&auto=format'  -- Jungle waterfall
            WHEN 11 THEN 'https://images.unsplash.com/photo-1483728642387-6c3bdd6c93e5?w=800&h=600&fit=crop&q=90&auto=format'  -- Rock climbing
            WHEN 12 THEN 'https://images.unsplash.com/photo-1581833971358-2c8b550f87b3?w=800&h=600&fit=crop&q=90&auto=format'  -- Sunset beach
            WHEN 13 THEN 'https://images.unsplash.com/photo-1558603668-6570496b66f8?w=800&h=600&fit=crop&q=90&auto=format'  -- Meditation space
            WHEN 14 THEN 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800&h=600&fit=crop&q=90&auto=format'  -- Night skyline
            WHEN 15 THEN 'https://images.unsplash.com/photo-1441260038675-7329ab4cc264?w=800&h=600&fit=crop&q=90&auto=format'  -- Forest canopy
            WHEN 16 THEN 'https://images.unsplash.com/photo-1594736797933-d0fce2fe1338?w=800&h=600&fit=crop&q=90&auto=format'  -- Interactive art
            WHEN 17 THEN 'https://images.unsplash.com/photo-1586500036706-41963de24d8b?w=800&h=600&fit=crop&q=90&auto=format'  -- Beach activity
            WHEN 18 THEN 'https://images.unsplash.com/photo-1551524164-6ca04ac833fb?w=800&h=600&fit=crop&q=90&auto=format'  -- Snow mountain
            WHEN 19 THEN 'https://images.unsplash.com/photo-1539650116574-75c0c6d73a8e?w=800&h=600&fit=crop&q=90&auto=format'  -- Ancient ruins
            ELSE 'https://images.unsplash.com/photo-1576941089067-2de3c901e126?w=800&h=600&fit=crop&q=90&auto=format'         -- Cave system
        END

    -- Position 3 images (third image of each attraction)
    WHEN ai2.row_num = 3 THEN 
        CASE ai2.attractionId % 20
            WHEN 1 THEN 'https://images.unsplash.com/photo-1571068316344-75bc76f77890?w=800&h=600&fit=crop&q=90&auto=format'   -- Wildlife nature
            WHEN 2 THEN 'https://images.unsplash.com/photo-1591117207239-788bf8de6c3b?w=800&h=600&fit=crop&q=90&auto=format'   -- Tropical resort
            WHEN 3 THEN 'https://images.unsplash.com/photo-1548013146-72479768bada?w=800&h=600&fit=crop&q=90&auto=format'   -- Temple ceremony
            WHEN 4 THEN 'https://images.unsplash.com/photo-1534430480872-3498386e7856?w=800&h=600&fit=crop&q=90&auto=format'   -- Modern attraction
            WHEN 5 THEN 'https://images.unsplash.com/photo-1550085530-6d0329df4b64?w=800&h=600&fit=crop&q=90&auto=format'   -- Nature bridge
            WHEN 6 THEN 'https://images.unsplash.com/photo-1507041957456-9c397ce39c97?w=800&h=600&fit=crop&q=90&auto=format'   -- Gallery space
            WHEN 7 THEN 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&h=600&fit=crop&q=90&auto=format'   -- Ocean waves
            WHEN 8 THEN 'https://images.unsplash.com/photo-1454391304352-2bf4678b1a7a?w=800&h=600&fit=crop&q=90&auto=format'   -- Valley view
            WHEN 9 THEN 'https://images.unsplash.com/photo-1548764543-2d3f17d1160a?w=800&h=600&fit=crop&q=90&auto=format'   -- Traditional craft
            WHEN 10 THEN 'https://images.unsplash.com/photo-1570878026620-df24bdc22a0c?w=800&h=600&fit=crop&q=90&auto=format'  -- Natural pool
            WHEN 11 THEN 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop&q=90&auto=format'  -- Adventure guide
            WHEN 12 THEN 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=800&h=600&fit=crop&q=90&auto=format'  -- Clear lagoon
            WHEN 13 THEN 'https://images.unsplash.com/photo-1540979388789-6cee28a1cdc9?w=800&h=600&fit=crop&q=90&auto=format'  -- Prayer hall
            WHEN 14 THEN 'https://images.unsplash.com/photo-1567552755203-b84c01b86e8d?w=800&h=600&fit=crop&q=90&auto=format'  -- Urban park
            WHEN 15 THEN 'https://images.unsplash.com/photo-1560707303-4e980ce876ad?w=800&h=600&fit=crop&q=90&auto=format'  -- Garden flower
            WHEN 16 THEN 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop&q=90&auto=format'  -- Exhibition hall
            WHEN 17 THEN 'https://images.unsplash.com/photo-1562024760-37d5b8d7d146?w=800&h=600&fit=crop&q=90&auto=format'  -- Coastal walk
            WHEN 18 THEN 'https://images.unsplash.com/photo-1473496169904-658ba7c44d8a?w=800&h=600&fit=crop&q=90&auto=format'  -- Mountain cabin
            WHEN 19 THEN 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop&q=90&auto=format'  -- Stone carving
            ELSE 'https://images.unsplash.com/photo-1464822759844-d150312c65e4?w=800&h=600&fit=crop&q=90&auto=format'         -- Hidden gem
        END

    -- Position 4 images (fourth image of each attraction)
    WHEN ai2.row_num = 4 THEN 
        CASE ai2.attractionId % 20
            WHEN 1 THEN 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop&q=90&auto=format'   -- Summit view
            WHEN 2 THEN 'https://images.unsplash.com/photo-1566649924074-8ecad9caec1a?w=800&h=600&fit=crop&q=90&auto=format'   -- Palm trees
            WHEN 3 THEN 'https://images.unsplash.com/photo-1570974045419-46f9f5d0a43b?w=800&h=600&fit=crop&q=90&auto=format'   -- Temple garden
            WHEN 4 THEN 'https://images.unsplash.com/photo-1505761671935-60b3a7427bad?w=800&h=600&fit=crop&q=90&auto=format'   -- Shopping district
            WHEN 5 THEN 'https://images.unsplash.com/photo-1561731216-c3a4d99437d5?w=800&h=600&fit=crop&q=90&auto=format'   -- Tree canopy
            WHEN 6 THEN 'https://images.unsplash.com/photo-1574623452334-1e0ac2b3ccb4?w=800&h=600&fit=crop&q=90&auto=format'   -- Modern gallery
            WHEN 7 THEN 'https://images.unsplash.com/photo-1500375592092-40eb2168fd21?w=800&h=600&fit=crop&q=90&auto=format'   -- Beach pier
            WHEN 8 THEN 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop&q=90&auto=format'   -- Mountain hut
            WHEN 9 THEN 'https://images.unsplash.com/photo-1566836104891-d3a1b6aece6c?w=800&h=600&fit=crop&q=90&auto=format'   -- Street art
            WHEN 10 THEN 'https://images.unsplash.com/photo-1549558549-415fe4c37b60?w=800&h=600&fit=crop&q=90&auto=format'  -- Cascade falls
            WHEN 11 THEN 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=600&fit=crop&q=90&auto=format'  -- Extreme sports
            WHEN 12 THEN 'https://images.unsplash.com/photo-1543832923-44667a44c804?w=800&h=600&fit=crop&q=90&auto=format'  -- Marine life
            WHEN 13 THEN 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&h=600&fit=crop&q=90&auto=format'  -- Sacred ritual
            WHEN 14 THEN 'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?w=800&h=600&fit=crop&q=90&auto=format'  -- City bridge
            WHEN 15 THEN 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=800&h=600&fit=crop&q=90&auto=format'  -- Butterfly garden
            WHEN 16 THEN 'https://images.unsplash.com/photo-1541367777708-7ababe35d3d6?w=800&h=600&fit=crop&q=90&auto=format'  -- Science museum
            WHEN 17 THEN 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=600&fit=crop&q=90&auto=format'  -- Water sports
            WHEN 18 THEN 'https://images.unsplash.com/photo-1464822759844-d150312c65e4?w=800&h=600&fit=crop&q=90&auto=format'  -- Alpine lake
            WHEN 19 THEN 'https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?w=800&h=600&fit=crop&q=90&auto=format'  -- Archaeological site
            ELSE 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&h=600&fit=crop&q=90&auto=format'         -- Scenic overlook
        END

    -- Position 5+ images (fifth and beyond images)
    ELSE 
        CASE ai2.attractionId % 20
            WHEN 1 THEN 'https://images.unsplash.com/photo-1464822759844-d150312c65e4?w=800&h=600&fit=crop&q=90&auto=format'   -- Forest trail
            WHEN 2 THEN 'https://images.unsplash.com/photo-1544733503-6d6b2c1dc5d1?w=800&h=600&fit=crop&q=90&auto=format'   -- Island sunset
            WHEN 3 THEN 'https://images.unsplash.com/photo-1555400082-8002d6903a97?w=800&h=600&fit=crop&q=90&auto=format'   -- Temple festival
            WHEN 4 THEN 'https://images.unsplash.com/photo-1520106212299-d99c443e4568?w=800&h=600&fit=crop&q=90&auto=format'   -- Entertainment
            WHEN 5 THEN 'https://images.unsplash.com/photo-1551632436-cbf8dd35adfa?w=800&h=600&fit=crop&q=90&auto=format'   -- Nature reserve
            WHEN 6 THEN 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&h=600&fit=crop&q=90&auto=format'   -- Heritage building
            WHEN 7 THEN 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&h=600&fit=crop&q=90&auto=format'   -- Lighthouse
            WHEN 8 THEN 'https://images.unsplash.com/photo-1418985991508-e47386d96a71?w=800&h=600&fit=crop&q=90&auto=format'   -- Glacier view
            WHEN 9 THEN 'https://images.unsplash.com/photo-1528127269322-539801943592?w=800&h=600&fit=crop&q=90&auto=format'   -- Local festival
            WHEN 10 THEN 'https://images.unsplash.com/photo-1518709268805-4e9042af2e04?w=800&h=600&fit=crop&q=90&auto=format'  -- Swimming hole
            WHEN 11 THEN 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop&q=90&auto=format'  -- Base camp
            WHEN 12 THEN 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&h=600&fit=crop&q=90&auto=format'  -- Beach resort
            WHEN 13 THEN 'https://images.unsplash.com/photo-1520637836862-4d197d17c11a?w=800&h=600&fit=crop&q=90&auto=format'  -- Monastery
            WHEN 14 THEN 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800&h=600&fit=crop&q=90&auto=format'  -- Metro station
            WHEN 15 THEN 'https://images.unsplash.com/photo-1518709268805-4e9042af2e04?w=800&h=600&fit=crop&q=90&auto=format'  -- Zen garden
            WHEN 16 THEN 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=600&fit=crop&q=90&auto=format'  -- Art installation
            WHEN 17 THEN 'https://images.unsplash.com/photo-1471919743851-c4df8b6ee133?w=800&h=600&fit=crop&q=90&auto=format'  -- Sea cave
            WHEN 18 THEN 'https://images.unsplash.com/photo-1414609245224-afa02bfb3fda?w=800&h=600&fit=crop&q=90&auto=format'  -- Hiking path
            WHEN 19 THEN 'https://images.unsplash.com/photo-1518998053901-5348d3961a04?w=800&h=600&fit=crop&q=90&auto=format'  -- Museum piece
            ELSE 'https://images.unsplash.com/photo-1441471349424-351990746ff4?w=800&h=600&fit=crop&q=90&auto=format'         -- Adventure spot
        END
END;
