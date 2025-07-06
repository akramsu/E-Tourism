-- Additional Visit data for demographic testing
-- This adds visit records that connect users to attractions, enabling demographic analysis

INSERT INTO visit (attractionId, visitDate, amount, duration, groupId, visitorFeedback, rating, userId, createdDate) VALUES
-- Recent visits for the last month (June-July 2025) to generate current data
(1, '2025-07-01 10:30:00', 25.50, 120, 'group1', 'Amazing experience!', 4.5, 1, '2025-07-01 10:30:00'),
(2, '2025-07-02 14:15:00', 35.00, 180, 'group2', 'Beautiful place to visit', 4.8, 3, '2025-07-02 14:15:00'),
(3, '2025-07-03 09:45:00', 15.75, 90, 'group3', 'Good for families', 4.2, 6, '2025-07-03 09:45:00'),
(4, '2025-07-04 16:20:00', 42.00, 240, 'group4', 'Excellent value for money', 4.9, 9, '2025-07-04 16:20:00'),
(5, '2025-07-05 11:00:00', 28.25, 150, 'group5', 'Nice cultural experience', 4.3, 11, '2025-07-05 11:00:00'),
(6, '2025-07-06 13:30:00', 18.50, 105, 'group6', 'Could be better maintained', 3.8, 15, '2025-07-06 13:30:00'),
(7, '2025-06-30 15:45:00', 55.00, 300, 'group7', 'Breathtaking views!', 5.0, 16, '2025-06-30 15:45:00'),
(8, '2025-06-29 12:10:00', 22.75, 135, 'group8', 'Good adventure activity', 4.4, 19, '2025-06-29 12:10:00'),
(9, '2025-06-28 14:25:00', 33.50, 210, 'group9', 'Interesting historical site', 4.6, 21, '2025-06-28 14:25:00'),
(10, '2025-06-27 10:15:00', 29.00, 165, 'group10', 'Well organized tour', 4.1, 25, '2025-06-27 10:15:00'),

-- More visits for demographic diversity
(1, '2025-06-26 11:30:00', 25.50, 120, 'group11', 'Great for kids', 4.7, 30, '2025-06-26 11:30:00'),
(2, '2025-06-25 09:20:00', 35.00, 180, 'group12', 'Very educational', 4.5, 32, '2025-06-25 09:20:00'),
(3, '2025-06-24 16:40:00', 15.75, 90, 'group13', 'Quick but enjoyable visit', 4.0, 34, '2025-06-24 16:40:00'),
(4, '2025-06-23 13:15:00', 42.00, 240, 'group14', 'Outstanding experience', 4.9, 36, '2025-06-23 13:15:00'),
(5, '2025-06-22 14:50:00', 28.25, 150, 'group15', 'Rich cultural heritage', 4.4, 38, '2025-06-22 14:50:00'),
(6, '2025-06-21 10:05:00', 18.50, 105, 'group16', 'Needs better facilities', 3.6, 40, '2025-06-21 10:05:00'),
(7, '2025-06-20 15:30:00', 55.00, 300, 'group17', 'Spectacular nature!', 4.8, 44, '2025-06-20 15:30:00'),
(8, '2025-06-19 12:45:00', 22.75, 135, 'group18', 'Fun adventure for all ages', 4.3, 46, '2025-06-19 12:45:00'),
(9, '2025-06-18 11:20:00', 33.50, 210, 'group19', 'Fascinating history', 4.7, 48, '2025-06-18 11:20:00'),
(10, '2025-06-17 09:35:00', 29.00, 165, 'group20', 'Professional guide', 4.2, 50, '2025-06-17 09:35:00'),

-- Add more visits with different attractions to spread the demographic data
(11, '2025-06-16 14:10:00', 31.25, 175, 'group21', 'Beautiful scenery', 4.6, 52, '2025-06-16 14:10:00'),
(12, '2025-06-15 10:45:00', 26.75, 140, 'group22', 'Good accessibility', 4.1, 54, '2025-06-15 10:45:00'),
(13, '2025-06-14 16:55:00', 19.50, 110, 'group23', 'Peaceful environment', 4.3, 56, '2025-06-14 16:55:00'),
(14, '2025-06-13 13:25:00', 38.00, 220, 'group24', 'Excellent facilities', 4.7, 58, '2025-06-13 13:25:00'),
(15, '2025-06-12 11:40:00', 24.50, 130, 'group25', 'Great photo opportunities', 4.4, 59, '2025-06-12 11:40:00'),
(16, '2025-06-11 15:15:00', 21.75, 125, 'group26', 'Unique experience', 4.5, 3, '2025-06-11 15:15:00'),
(17, '2025-06-10 12:30:00', 44.25, 250, 'group27', 'Worth every penny', 4.8, 6, '2025-06-10 12:30:00'),
(18, '2025-06-09 09:50:00', 27.00, 145, 'group28', 'Good value', 4.2, 9, '2025-06-09 09:50:00'),
(19, '2025-06-08 14:35:00', 36.50, 195, 'group29', 'Highly recommended', 4.9, 11, '2025-06-08 14:35:00'),
(20, '2025-06-07 11:05:00', 23.25, 115, 'group30', 'Nice for a short visit', 4.0, 15, '2025-06-07 11:05:00'),

-- Add visits for older attractions to ensure all have some data
(25, '2025-06-06 16:20:00', 30.00, 160, 'group31', 'Impressive architecture', 4.5, 16, '2025-06-06 16:20:00'),
(30, '2025-06-05 13:45:00', 17.50, 95, 'group32', 'Good for beginners', 3.9, 19, '2025-06-05 13:45:00'),
(35, '2025-06-04 10:25:00', 41.75, 235, 'group33', 'Challenging but rewarding', 4.6, 21, '2025-06-04 10:25:00'),
(40, '2025-06-03 15:10:00', 28.50, 155, 'group34', 'Well maintained facility', 4.3, 25, '2025-06-03 15:10:00'),
(45, '2025-06-02 12:00:00', 32.25, 180, 'group35', 'Educational and fun', 4.7, 30, '2025-06-02 12:00:00'),
(50, '2025-06-01 14:40:00', 25.00, 135, 'group36', 'Great staff service', 4.4, 32, '2025-06-01 14:40:00'),

-- Add some repeat visits from same users to different attractions
(1, '2025-05-31 11:15:00', 25.50, 120, 'group37', 'Second visit, still great!', 4.6, 1, '2025-05-31 11:15:00'),
(10, '2025-05-30 09:30:00', 29.00, 165, 'group38', 'Brought friends this time', 4.5, 3, '2025-05-30 09:30:00'),
(15, '2025-05-29 16:00:00', 24.50, 130, 'group39', 'Different season, different experience', 4.2, 6, '2025-05-29 16:00:00'),
(20, '2025-05-28 13:20:00', 23.25, 115, 'group40', 'Consistent quality', 4.3, 9, '2025-05-28 13:20:00'),

-- Add some visits from users with different demographics (older/younger users)
(5, '2025-05-27 10:45:00', 28.25, 150, 'group41', 'Perfect for seniors', 4.4, 44, '2025-05-27 10:45:00'),  -- user44: 1966-04-01 (59 years old)
(8, '2025-05-26 15:25:00', 22.75, 135, 'group42', 'Young adults loved it', 4.7, 25, '2025-05-26 15:25:00'), -- user25: 2003-08-19 (21 years old)
(12, '2025-05-25 12:10:00', 26.75, 140, 'group43', 'Multi-generational fun', 4.5, 53, '2025-05-25 12:10:00'), -- user53: 2000-06-28 (24 years old)
(18, '2025-05-24 14:55:00', 27.00, 145, 'group44', 'Great for middle-aged visitors', 4.2, 33, '2025-05-24 14:55:00'); -- user33: 1984-08-16 (40 years old)
