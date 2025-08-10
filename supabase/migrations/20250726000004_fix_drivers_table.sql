-- Create drivers table
CREATE TABLE IF NOT EXISTS public.drivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  partner_id UUID REFERENCES public.partners(id) ON DELETE SET NULL,
  license_number TEXT UNIQUE,
  license_expiry TIMESTAMP WITH TIME ZONE,
  insurance_number TEXT,
  insurance_expiry TIMESTAMP WITH TIME ZONE,
  experience INTEGER DEFAULT 0,
  rating NUMERIC DEFAULT 0,
  total_trips INTEGER DEFAULT 0,
  total_earnings NUMERIC DEFAULT 0,
  is_approved BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- Enable RLS on drivers table
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;

-- Create basic RLS policies for drivers
CREATE POLICY "Drivers can view their own data" ON public.drivers
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Drivers can update their own data" ON public.drivers
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Partners can view their drivers" ON public.drivers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.partners 
      WHERE partners.id = drivers.partner_id 
      AND partners.user_id = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_drivers_user_id ON public.drivers(user_id);
CREATE INDEX IF NOT EXISTS idx_drivers_partner_id ON public.drivers(partner_id);
CREATE INDEX IF NOT EXISTS idx_drivers_license_number ON public.drivers(license_number);
CREATE INDEX IF NOT EXISTS idx_drivers_is_active ON public.drivers(is_active); 