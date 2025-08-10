-- Fix chat_sessions category constraint to allow more categories
-- Drop the existing constraint
ALTER TABLE chat_sessions DROP CONSTRAINT IF EXISTS chat_sessions_category_check;

-- Add the new constraint that includes more categories
ALTER TABLE chat_sessions ADD CONSTRAINT chat_sessions_category_check 
  CHECK (category IN ('technical', 'billing', 'account', 'vehicle', 'booking', 'payment', 'documentation', 'general', 'app', 'earnings', 'trips', 'support')); 