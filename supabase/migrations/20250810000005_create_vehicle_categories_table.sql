-- Create vehicle_categories table
CREATE TABLE IF NOT EXISTS vehicle_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  partner_id UUID REFERENCES partners(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  daily_rate_range VARCHAR(50),
  min_rate DECIMAL(10,2),
  max_rate DECIMAL(10,2),
  target_market VARCHAR(200),
  features TEXT[],
  vehicle_count INTEGER DEFAULT 0,
  total_revenue DECIMAL(12,2) DEFAULT 0,
  average_rating DECIMAL(3,2) DEFAULT 4.0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_vehicle_categories_partner_id ON vehicle_categories(partner_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_categories_name ON vehicle_categories(name);
CREATE INDEX IF NOT EXISTS idx_vehicle_categories_is_active ON vehicle_categories(is_active);

-- Enable RLS
ALTER TABLE vehicle_categories ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Partners can view their own vehicle categories" ON vehicle_categories;
DROP POLICY IF EXISTS "Partners can insert their own vehicle categories" ON vehicle_categories;
DROP POLICY IF EXISTS "Partners can update their own vehicle categories" ON vehicle_categories;
DROP POLICY IF EXISTS "Partners can delete their own vehicle categories" ON vehicle_categories;
DROP POLICY IF EXISTS "Admins can view all vehicle categories" ON vehicle_categories;
DROP POLICY IF EXISTS "Admins can manage all vehicle categories" ON vehicle_categories;

-- RLS Policies
CREATE POLICY "Partners can view their own vehicle categories" ON vehicle_categories
  FOR SELECT USING (partner_id = auth.uid());

CREATE POLICY "Partners can insert their own vehicle categories" ON vehicle_categories
  FOR INSERT WITH CHECK (partner_id = auth.uid());

CREATE POLICY "Partners can update their own vehicle categories" ON vehicle_categories
  FOR UPDATE USING (partner_id = auth.uid());

CREATE POLICY "Partners can delete their own vehicle categories" ON vehicle_categories
  FOR DELETE USING (partner_id = auth.uid());

-- Admin policies
CREATE POLICY "Admins can view all vehicle categories" ON vehicle_categories
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('ADMIN', 'SUPER_ADMIN')
    )
  );

CREATE POLICY "Admins can manage all vehicle categories" ON vehicle_categories
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('ADMIN', 'SUPER_ADMIN')
    )
  );

-- Add trigger to update updated_at
DROP TRIGGER IF EXISTS update_vehicle_categories_updated_at ON vehicle_categories;
DROP FUNCTION IF EXISTS update_vehicle_categories_updated_at();

CREATE OR REPLACE FUNCTION update_vehicle_categories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_vehicle_categories_updated_at
  BEFORE UPDATE ON vehicle_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_vehicle_categories_updated_at(); 