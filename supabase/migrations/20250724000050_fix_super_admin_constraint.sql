-- Fix admin_staff role constraint to allow SUPER_ADMIN
ALTER TABLE admin_staff DROP CONSTRAINT IF EXISTS admin_staff_role_check;
ALTER TABLE admin_staff ADD CONSTRAINT admin_staff_role_check 
  CHECK (role IN ('ADMIN', 'ADMIN_STAFF', 'SUPER_ADMIN'));

-- Update existing admin user to SUPER_ADMIN
UPDATE admin_staff 
SET role = 'SUPER_ADMIN', is_active = true 
WHERE user_id = 'e834acc3-029c-4a6c-81f3-e0d58f3f9017'; 