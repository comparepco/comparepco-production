-- Create pricing_templates table
CREATE TABLE IF NOT EXISTS pricing_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  make VARCHAR(100),
  model VARCHAR(100),
  daily_rate DECIMAL(10,2) NOT NULL,
  weekly_rate DECIMAL(10,2),
  monthly_rate DECIMAL(10,2),
  ride_hailing_categories TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_pricing_templates_partner_id ON pricing_templates(partner_id);
CREATE INDEX IF NOT EXISTS idx_pricing_templates_category ON pricing_templates(category);
CREATE INDEX IF NOT EXISTS idx_pricing_templates_make ON pricing_templates(make);
CREATE INDEX IF NOT EXISTS idx_pricing_templates_model ON pricing_templates(model);
CREATE INDEX IF NOT EXISTS idx_pricing_templates_is_active ON pricing_templates(is_active);

-- Add RLS policies for pricing_templates
ALTER TABLE pricing_templates ENABLE ROW LEVEL SECURITY;

-- Policy for partners to view their own pricing templates
CREATE POLICY "Partners can view their own pricing templates" ON pricing_templates
  FOR SELECT USING (
    partner_id IN (
      SELECT id FROM partners WHERE user_id = auth.uid()
    )
  );

-- Policy for partners to insert their own pricing templates
CREATE POLICY "Partners can insert their own pricing templates" ON pricing_templates
  FOR INSERT WITH CHECK (
    partner_id IN (
      SELECT id FROM partners WHERE user_id = auth.uid()
    )
  );

-- Policy for partners to update their own pricing templates
CREATE POLICY "Partners can update their own pricing templates" ON pricing_templates
  FOR UPDATE USING (
    partner_id IN (
      SELECT id FROM partners WHERE user_id = auth.uid()
    )
  );

-- Policy for partners to delete their own pricing templates
CREATE POLICY "Partners can delete their own pricing templates" ON pricing_templates
  FOR DELETE USING (
    partner_id IN (
      SELECT id FROM partners WHERE user_id = auth.uid()
    )
  );

-- Ensure vehicles table has all necessary pricing fields
DO $$ 
BEGIN
  -- Add daily_rate if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vehicles' AND column_name = 'daily_rate') THEN
    ALTER TABLE vehicles ADD COLUMN daily_rate DECIMAL(10,2);
  END IF;
  
  -- Add weekly_rate if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vehicles' AND column_name = 'weekly_rate') THEN
    ALTER TABLE vehicles ADD COLUMN weekly_rate DECIMAL(10,2);
  END IF;
  
  -- Add monthly_rate if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vehicles' AND column_name = 'monthly_rate') THEN
    ALTER TABLE vehicles ADD COLUMN monthly_rate DECIMAL(10,2);
  END IF;
  
  -- Add price_per_day if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vehicles' AND column_name = 'price_per_day') THEN
    ALTER TABLE vehicles ADD COLUMN price_per_day DECIMAL(10,2);
  END IF;
  
  -- Add price_per_week if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vehicles' AND column_name = 'price_per_week') THEN
    ALTER TABLE vehicles ADD COLUMN price_per_week DECIMAL(10,2);
  END IF;
  
  -- Add ride_hailing_categories if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vehicles' AND column_name = 'ride_hailing_categories') THEN
    ALTER TABLE vehicles ADD COLUMN ride_hailing_categories TEXT[] DEFAULT '{}';
  END IF;
  
  -- Add category if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vehicles' AND column_name = 'category') THEN
    ALTER TABLE vehicles ADD COLUMN category VARCHAR(100);
  END IF;
END $$;

-- Add indexes for vehicles pricing fields
CREATE INDEX IF NOT EXISTS idx_vehicles_daily_rate ON vehicles(daily_rate);
CREATE INDEX IF NOT EXISTS idx_vehicles_weekly_rate ON vehicles(weekly_rate);
CREATE INDEX IF NOT EXISTS idx_vehicles_monthly_rate ON vehicles(monthly_rate);
CREATE INDEX IF NOT EXISTS idx_vehicles_category ON vehicles(category);
CREATE INDEX IF NOT EXISTS idx_vehicles_make ON vehicles(make);
CREATE INDEX IF NOT EXISTS idx_vehicles_model ON vehicles(model);
CREATE INDEX IF NOT EXISTS idx_vehicles_ride_hailing_categories ON vehicles USING GIN(ride_hailing_categories);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for pricing_templates updated_at
CREATE TRIGGER update_pricing_templates_updated_at 
    BEFORE UPDATE ON pricing_templates 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create trigger for vehicles updated_at
CREATE TRIGGER update_vehicles_updated_at 
    BEFORE UPDATE ON vehicles 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column(); 