-- Create a driver account
INSERT INTO public.drivers (
  id,
  email,
  name,
  phone,
  status,
  profile_completed,
  email_verified,
  roles,
  profile,
  address,
  consents,
  marketing_preferences,
  created_at,
  updated_at
) VALUES (
  'driver_' || extract(epoch from now())::bigint,
  'driver@example.com',
  'John Driver',
  '+1234567890',
  'active',
  false,
  false,
  ARRAY['DRIVER'],
  '{"license_number": "DL123456789", "vehicle_type": "sedan", "experience_years": 2, "rating": 0}'::jsonb,
  '{"street": "123 Main St", "city": "New York", "state": "NY", "zip": "10001", "country": "USA"}'::jsonb,
  '{"terms_accepted": true, "privacy_policy": true, "marketing": false}'::jsonb,
  '{"email_notifications": true, "sms_notifications": false, "push_notifications": true}'::jsonb,
  now(),
  now()
);

-- Also create a user account for authentication
INSERT INTO public.users (
  id,
  email,
  name,
  phone,
  role,
  status,
  is_active,
  email_verified,
  profile_completed,
  profile,
  address,
  consents,
  marketing_preferences,
  created_at,
  updated_at
) VALUES (
  'driver_' || extract(epoch from now())::bigint,
  'driver@example.com',
  'John Driver',
  '+1234567890',
  'DRIVER',
  'active',
  true,
  false,
  false,
  '{"license_number": "DL123456789", "vehicle_type": "sedan", "experience_years": 2, "rating": 0}'::jsonb,
  '{"street": "123 Main St", "city": "New York", "state": "NY", "zip": "10001", "country": "USA"}'::jsonb,
  '{"terms_accepted": true, "privacy_policy": true, "marketing": false}'::jsonb,
  '{"email_notifications": true, "sms_notifications": false, "push_notifications": true}'::jsonb,
  now(),
  now()
); 