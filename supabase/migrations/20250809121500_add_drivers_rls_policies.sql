-- Add RLS policies for public.drivers so admins can see new signups

-- Ensure RLS is enabled (safe if already enabled)
ALTER TABLE IF EXISTS public.drivers ENABLE ROW LEVEL SECURITY;

-- Allow a driver to view their own driver row
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'drivers' 
      AND policyname = 'Drivers can view their own record'
  ) THEN
    CREATE POLICY "Drivers can view their own record" ON public.drivers
      FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Allow partners to view driver rows linked to them (if assigned)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'drivers' 
      AND policyname = 'Partners can view assigned drivers'
  ) THEN
    CREATE POLICY "Partners can view assigned drivers" ON public.drivers
      FOR SELECT
      USING (partner_id = auth.uid());
  END IF;
END $$;

-- Allow admins/staff to view and manage all drivers
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'drivers' 
      AND policyname = 'Admins can manage all drivers'
  ) THEN
    CREATE POLICY "Admins can manage all drivers" ON public.drivers
      FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM public.users u
          WHERE u.id = auth.uid()
            AND u.role IN ('ADMIN','ADMIN_STAFF','SUPER_ADMIN')
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.users u
          WHERE u.id = auth.uid()
            AND u.role IN ('ADMIN','ADMIN_STAFF','SUPER_ADMIN')
        )
      );
  END IF;
END $$;

