-- Add tag data to vehicles so they show insurance, deposit, and other tags
-- This will make the car cards display proper tags

-- Update vehicles with tag data (using simple JSON structure)
UPDATE vehicles 
SET 
  insurance_included = true,
  pricing = '{"min_term_months": 3, "deposit_required": true, "deposit_amount": 500}'::jsonb,
  category = 'COMFORT',
  fuel_type = 'HYBRID',
  transmission = 'AUTOMATIC',
  year = 2023,
  mileage = 15000,
  doors = 4,
  seats = 5,
  features = ARRAY['Bluetooth', 'Air Conditioning', 'Cruise Control', 'Parking Sensors']
WHERE id IN (
  SELECT id FROM vehicles 
  WHERE is_approved = true 
  ORDER BY created_at 
  LIMIT 2
);

-- Update the third vehicle with different settings
UPDATE vehicles 
SET 
  insurance_included = false,
  pricing = '{"min_term_months": 6, "deposit_required": false, "deposit_amount": 0}'::jsonb,
  category = 'EXEC',
  fuel_type = 'ELECTRIC',
  transmission = 'AUTOMATIC',
  year = 2024,
  mileage = 5000,
  doors = 5,
  seats = 7,
  features = ARRAY['Electric', 'Premium Sound', 'Navigation', 'Heated Seats']
WHERE id IN (
  SELECT id FROM vehicles 
  WHERE is_approved = true 
  ORDER BY created_at 
  LIMIT 1 OFFSET 2
); 