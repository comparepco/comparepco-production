-- Fix all support system constraints to properly support drivers, partners, and customers

-- 1. Fix chat_sessions customer_type constraint
ALTER TABLE chat_sessions DROP CONSTRAINT IF EXISTS chat_sessions_customer_type_check;
ALTER TABLE chat_sessions ADD CONSTRAINT chat_sessions_customer_type_check 
  CHECK (customer_type IN ('customer', 'driver', 'partner'));

-- 2. Fix chat_messages sender_type constraint  
ALTER TABLE chat_messages DROP CONSTRAINT IF EXISTS chat_messages_sender_type_check;
ALTER TABLE chat_messages ADD CONSTRAINT chat_messages_sender_type_check 
  CHECK (sender_type IN ('customer', 'driver', 'partner', 'agent', 'system'));

-- 3. Fix support_tickets user_type constraint (if it exists)
ALTER TABLE support_tickets DROP CONSTRAINT IF EXISTS support_tickets_user_type_check;
ALTER TABLE support_tickets ADD CONSTRAINT support_tickets_user_type_check 
  CHECK (user_type IN ('customer', 'driver', 'partner'));

-- 4. Add user_type column to support_tickets if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'support_tickets' AND column_name = 'user_type') THEN
        ALTER TABLE support_tickets ADD COLUMN user_type TEXT DEFAULT 'customer';
    END IF;
END $$;

-- 5. Update existing records to have proper user_type
UPDATE support_tickets SET user_type = 'customer' WHERE user_type IS NULL;

-- 6. Create indexes for better performance on user_type columns
CREATE INDEX IF NOT EXISTS idx_chat_sessions_customer_type ON chat_sessions(customer_type);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender_type ON chat_messages(sender_type);
CREATE INDEX IF NOT EXISTS idx_support_tickets_user_type ON support_tickets(user_type); 