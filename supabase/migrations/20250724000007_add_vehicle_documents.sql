-- Create admins table first
CREATE TABLE IF NOT EXISTS admins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'admin',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS to admins table
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- Policy for admins to view their own records
CREATE POLICY "Admins can view own records" ON admins
  FOR SELECT USING (user_id = auth.uid());

-- Policy for admins to insert their own records
CREATE POLICY "Admins can insert own records" ON admins
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Create vehicle_documents table
CREATE TABLE IF NOT EXISTS vehicle_documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  partner_id UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  expiry_date TIMESTAMP WITH TIME ZONE,
  upload_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'pending_review',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_vehicle_documents_vehicle_id ON vehicle_documents(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_documents_partner_id ON vehicle_documents(partner_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_documents_type ON vehicle_documents(type);
CREATE INDEX IF NOT EXISTS idx_vehicle_documents_status ON vehicle_documents(status);

-- Add RLS policies
ALTER TABLE vehicle_documents ENABLE ROW LEVEL SECURITY;

-- Policy for partners to view their own vehicle documents
CREATE POLICY "Partners can view their own vehicle documents" ON vehicle_documents
  FOR SELECT USING (
    partner_id IN (
      SELECT id FROM partners WHERE user_id = auth.uid()
    )
  );

-- Policy for partners to insert their own vehicle documents
CREATE POLICY "Partners can insert their own vehicle documents" ON vehicle_documents
  FOR INSERT WITH CHECK (
    partner_id IN (
      SELECT id FROM partners WHERE user_id = auth.uid()
    )
  );

-- Policy for partners to update their own vehicle documents
CREATE POLICY "Partners can update their own vehicle documents" ON vehicle_documents
  FOR UPDATE USING (
    partner_id IN (
      SELECT id FROM partners WHERE user_id = auth.uid()
    )
  );

-- Policy for admins to view all vehicle documents
CREATE POLICY "Admins can view all vehicle documents" ON vehicle_documents
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admins WHERE user_id = auth.uid()
    )
  );

-- Policy for admins to update all vehicle documents
CREATE POLICY "Admins can update all vehicle documents" ON vehicle_documents
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM admins WHERE user_id = auth.uid()
    )
  ); 