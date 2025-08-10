-- Migration: Fix Missing Support Columns
-- Description: Add missing columns that are causing support system failures
-- Date: 2025-01-06

-- Fix support_staff table - add missing columns
ALTER TABLE support_staff 
ADD COLUMN IF NOT EXISTS current_tickets INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_tickets_resolved INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS department TEXT DEFAULT 'Customer Support';

-- Fix support_tickets table - add missing columns
ALTER TABLE support_tickets 
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'web',
ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES support_staff(id);

-- Fix chat_sessions table - add missing columns
ALTER TABLE chat_sessions 
ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES support_staff(id),
ADD COLUMN IF NOT EXISTS last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'web';

-- Fix support_notifications table - add missing columns
ALTER TABLE support_notifications 
ADD COLUMN IF NOT EXISTS notification_type TEXT DEFAULT 'general',
ADD COLUMN IF NOT EXISTS recipient_email TEXT,
ADD COLUMN IF NOT EXISTS recipient_name TEXT;

-- Fix chat_messages table - add missing columns
ALTER TABLE chat_messages 
ADD COLUMN IF NOT EXISTS sender_email TEXT,
ADD COLUMN IF NOT EXISTS sender_name TEXT,
ADD COLUMN IF NOT EXISTS is_from_customer BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Update existing support_notifications to use new structure
UPDATE support_notifications 
SET notification_type = type 
WHERE notification_type IS NULL AND type IS NOT NULL;

-- Update existing chat_messages to use new structure
UPDATE chat_messages 
SET sender_email = sender_id::text,
    sender_name = sender_id::text,
    is_from_customer = (sender_type = 'customer')
WHERE sender_email IS NULL;

-- Create indexes for new columns
CREATE INDEX IF NOT EXISTS idx_support_tickets_source ON support_tickets(source);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_source ON chat_sessions(source);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_assigned_to ON chat_sessions(assigned_to);
CREATE INDEX IF NOT EXISTS idx_support_notifications_notification_type ON support_notifications(notification_type);
CREATE INDEX IF NOT EXISTS idx_support_notifications_recipient_email ON support_notifications(recipient_email);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender_email ON chat_messages(sender_email);
CREATE INDEX IF NOT EXISTS idx_chat_messages_is_from_customer ON chat_messages(is_from_customer); 