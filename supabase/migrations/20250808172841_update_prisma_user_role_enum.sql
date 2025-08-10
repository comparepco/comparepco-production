-- Update database to remove USER role references
-- This ensures the database schema matches our application code

-- 1. Update any existing users with 'user' role to 'driver' role
UPDATE public.users 
SET role = 'driver' 
WHERE role = 'user' OR role = 'USER';

-- 2. Update any existing users with 'user' role to 'driver' role (case insensitive)
UPDATE public.users 
SET role = 'driver' 
WHERE LOWER(role) = 'user';

-- 3. Update any users with null role to 'driver' role
UPDATE public.users 
SET role = 'driver' 
WHERE role IS NULL;

-- 4. Update any users with empty role to 'driver' role
UPDATE public.users 
SET role = 'driver' 
WHERE role = '';

-- 5. Ensure all users have a valid role (default to driver if still invalid)
UPDATE public.users 
SET role = 'driver' 
WHERE role NOT IN ('super_admin', 'admin', 'admin_staff', 'staff', 'partner', 'partner_staff', 'driver');

-- 6. Update auth.users metadata if any users have USER role in raw_user_meta_data
UPDATE auth.users 
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'::jsonb),
  '{role}',
  '"driver"'
)
WHERE raw_user_meta_data->>'role' = 'user' 
   OR raw_user_meta_data->>'role' = 'USER'
   OR raw_user_meta_data->>'role' IS NULL;

-- 7. Add a check constraint to prevent future USER role assignments (if it doesn't exist)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'check_valid_roles' 
    AND table_name = 'users'
  ) THEN
    ALTER TABLE public.users 
    ADD CONSTRAINT check_valid_roles 
    CHECK (role IN ('super_admin', 'admin', 'admin_staff', 'staff', 'partner', 'partner_staff', 'driver'));
  END IF;
END $$;

-- 8. Set the default value for the role column to 'driver'
ALTER TABLE public.users 
ALTER COLUMN role SET DEFAULT 'driver';
