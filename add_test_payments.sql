-- Add test payment instructions to the database
-- This script can be run directly in your database

-- First, ensure we have a test partner
INSERT INTO partners (id, user_id, company_name, business_type, address, city, state, country, postal_code, phone, is_approved, is_active, created_at, updated_at)
VALUES (
  'test-partner-id',
  'test-user-id',
  'Test Partner Company',
  'PCO',
  '123 Test Street',
  'London',
  'England',
  'UK',
  'SW1A 1AA',
  '+44123456789',
  true,
  true,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Add test payment instructions
INSERT INTO payment_instructions (
  id,
  partner_id,
  booking_id,
  driver_id,
  driver_name,
  vehicle_reg,
  amount,
  method,
  frequency,
  type,
  next_due_date,
  status,
  reason,
  created_at,
  updated_at
) VALUES 
(
  'test-payment-1',
  'test-partner-id',
  'test-booking-1',
  'test-driver-1',
  'John Smith',
  'AB12 CDE',
  150.00,
  'bank_transfer',
  'weekly',
  'weekly_rent',
  (NOW() + INTERVAL '7 days')::date,
  'pending',
  'Weekly rent payment',
  NOW(),
  NOW()
),
(
  'test-payment-2',
  'test-partner-id',
  'test-booking-2',
  'test-driver-2',
  'Jane Doe',
  'XY34 FGH',
  200.00,
  'bank_transfer',
  'weekly',
  'deposit',
  (NOW() + INTERVAL '3 days')::date,
  'deposit_pending',
  'Security deposit',
  NOW(),
  NOW()
),
(
  'test-payment-3',
  'test-partner-id',
  'test-booking-3',
  'test-driver-3',
  'Mike Johnson',
  'LM56 NOP',
  75.00,
  'direct_debit',
  'one_off',
  'adjustment',
  (NOW() + INTERVAL '1 day')::date,
  'sent',
  'Late payment adjustment',
  NOW(),
  NOW()
),
(
  'test-payment-4',
  'test-partner-id',
  'test-booking-4',
  'test-driver-4',
  'Sarah Wilson',
  'QR78 STU',
  300.00,
  'bank_transfer',
  'weekly',
  'weekly_rent',
  (NOW() - INTERVAL '2 days')::date,
  'auto',
  'Weekly rent payment',
  NOW(),
  NOW()
),
(
  'test-payment-5',
  'test-partner-id',
  'test-booking-5',
  'test-driver-5',
  'David Brown',
  'VW90 XYZ',
  125.00,
  'direct_debit',
  'one_off',
  'topup',
  (NOW() + INTERVAL '5 days')::date,
  'pending',
  'Account top-up',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- Verify the data was inserted
SELECT 
  driver_name,
  vehicle_reg,
  amount,
  type,
  status,
  next_due_date
FROM payment_instructions 
WHERE partner_id = 'test-partner-id'
ORDER BY created_at; 