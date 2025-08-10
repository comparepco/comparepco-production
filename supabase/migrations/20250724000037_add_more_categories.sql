-- Add more categories to support enhanced chat widget
-- Update chat_sessions category constraint
ALTER TABLE chat_sessions DROP CONSTRAINT IF EXISTS chat_sessions_category_check;
ALTER TABLE chat_sessions ADD CONSTRAINT chat_sessions_category_check 
  CHECK (category IN ('technical', 'billing', 'account', 'vehicle', 'booking', 'payment', 'documentation', 'general', 'app', 'earnings', 'trips', 'support', 'driver', 'fleet'));

-- Update support_tickets category constraint if it exists
ALTER TABLE support_tickets DROP CONSTRAINT IF EXISTS support_tickets_category_check;
ALTER TABLE support_tickets ADD CONSTRAINT support_tickets_category_check 
  CHECK (category IN ('technical', 'billing', 'account', 'vehicle', 'booking', 'payment', 'documentation', 'general', 'app', 'earnings', 'trips', 'support', 'driver', 'fleet')); 