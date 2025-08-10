-- Update vehicles to make them available on the platform
-- This will make some vehicles approved and visible

-- Update the first few vehicles to be available
UPDATE vehicles 
SET 
  is_approved = true,
  visible_on_platform = true,
  price_per_day = COALESCE(price_per_day, 35),
  name = CASE 
    WHEN name IS NULL OR name = 'Unnamed' THEN CONCAT(make, ' ', model)
    ELSE name
  END
WHERE id IN (
  SELECT id FROM vehicles 
  ORDER BY created_at 
  LIMIT 3
);

-- Also update vehicles to have proper names if they're unnamed
UPDATE vehicles 
SET name = CONCAT(make, ' ', model)
WHERE name IS NULL OR name = 'Unnamed';

-- Update prices for vehicles that have null prices
UPDATE vehicles 
SET price_per_day = 35
WHERE price_per_day IS NULL; 