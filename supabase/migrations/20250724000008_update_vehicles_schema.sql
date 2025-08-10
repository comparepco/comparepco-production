-- Add missing fields to vehicles table for edit vehicle functionality
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS engine TEXT;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS price_per_week DECIMAL(10,2);
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS price_per_day DECIMAL(10,2);
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS image_urls TEXT[] DEFAULT '{}';
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS insurance_expiry TIMESTAMP WITH TIME ZONE;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS mot_expiry TIMESTAMP WITH TIME ZONE;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS road_tax_expiry TIMESTAMP WITH TIME ZONE;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS next_service TIMESTAMP WITH TIME ZONE;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS insurance_included BOOLEAN DEFAULT false;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS insurance_details JSONB;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS pricing JSONB;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS ride_hailing_categories TEXT[] DEFAULT '{}';

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_vehicles_partner_id ON vehicles(partner_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_category ON vehicles(category);
CREATE INDEX IF NOT EXISTS idx_vehicles_status ON vehicles(status);
CREATE INDEX IF NOT EXISTS idx_vehicles_insurance_expiry ON vehicles(insurance_expiry);
CREATE INDEX IF NOT EXISTS idx_vehicles_mot_expiry ON vehicles(mot_expiry);
CREATE INDEX IF NOT EXISTS idx_vehicles_next_service ON vehicles(next_service); 