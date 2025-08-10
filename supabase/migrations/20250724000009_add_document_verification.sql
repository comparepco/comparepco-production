-- Add document verification fields to vehicles table
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS documents JSONB DEFAULT '{}';
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS document_verification_status TEXT DEFAULT 'pending';
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS visible_on_platform BOOLEAN DEFAULT false;

-- Add indexes for document verification
CREATE INDEX IF NOT EXISTS idx_vehicles_document_status ON vehicles(document_verification_status);
CREATE INDEX IF NOT EXISTS idx_vehicles_visible_platform ON vehicles(visible_on_platform);

-- Add RLS policies for document verification
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Partners can view their own vehicle documents') THEN
    CREATE POLICY "Partners can view their own vehicle documents" ON vehicles
      FOR SELECT USING (
        partner_id IN (
          SELECT id FROM partners WHERE user_id = auth.uid()
          UNION
          SELECT partner_id FROM partner_staff WHERE user_id = auth.uid()
        )
      );
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Partners can update their own vehicle documents') THEN
    CREATE POLICY "Partners can update their own vehicle documents" ON vehicles
      FOR UPDATE USING (
        partner_id IN (
          SELECT id FROM partners WHERE user_id = auth.uid()
          UNION
          SELECT partner_id FROM partner_staff WHERE user_id = auth.uid()
        )
      );
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can view all vehicle documents') THEN
    CREATE POLICY "Admins can view all vehicle documents" ON vehicles
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM admins WHERE user_id = auth.uid()
        )
      );
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can update all vehicle documents') THEN
    CREATE POLICY "Admins can update all vehicle documents" ON vehicles
      FOR UPDATE USING (
        EXISTS (
          SELECT 1 FROM admins WHERE user_id = auth.uid()
        )
      );
  END IF;
END $$; 