-- Add diverse international postcodes for testing country mapping
UPDATE user SET postcode = '10001' WHERE id = 1; -- US ZIP code
UPDATE user SET postcode = 'SW1A 1AA' WHERE id = 2; -- UK postcode  
UPDATE user SET postcode = 'K1A 0A6' WHERE id = 3; -- Canadian postcode
UPDATE user SET postcode = '10115' WHERE id = 4; -- German postcode
UPDATE user SET postcode = '75001' WHERE id = 5; -- French postcode
UPDATE user SET postcode = '100-0001' WHERE id = 6; -- Japanese postcode
UPDATE user SET postcode = '1012 AB' WHERE id = 7; -- Netherlands postcode
UPDATE user SET postcode = '3000' WHERE id = 8; -- Australian postcode (Melbourne)
UPDATE user SET postcode = '2000' WHERE id = 9; -- Australian postcode (Sydney)
UPDATE user SET postcode = '90210' WHERE id = 10; -- US postcode (Beverly Hills)
UPDATE user SET postcode = 'M5V 3A5' WHERE id = 11; -- Canadian postcode
UPDATE user SET postcode = 'EC2N 2DB' WHERE id = 12; -- UK postcode
UPDATE user SET postcode = '01069' WHERE id = 13; -- German postcode
UPDATE user SET postcode = '4000' WHERE id = 14; -- Australian postcode (Brisbane)
UPDATE user SET postcode = '5000' WHERE id = 15; -- Australian postcode (Adelaide)
