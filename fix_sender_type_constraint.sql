-- Fix chat_messages sender_type constraint to include 'partner'
-- Drop the existing constraint
ALTER TABLE chat_messages DROP CONSTRAINT IF EXISTS chat_messages_sender_type_check;

-- Add the new constraint that includes 'partner'
ALTER TABLE chat_messages ADD CONSTRAINT chat_messages_sender_type_check 
  CHECK (sender_type IN ('customer', 'partner', 'agent', 'system')); 