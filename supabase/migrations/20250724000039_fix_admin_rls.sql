-- Fix RLS policies for admin support tables
-- Enable RLS on support_tickets if not already enabled
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

-- Drop existing policies and create new ones for support_tickets
DROP POLICY IF EXISTS "Authenticated users can view tickets" ON support_tickets;
DROP POLICY IF EXISTS "Authenticated users can create tickets" ON support_tickets;
DROP POLICY IF EXISTS "Authenticated users can update tickets" ON support_tickets;
DROP POLICY IF EXISTS "Service role can access all support data" ON support_tickets;

-- Create policies for support_tickets
CREATE POLICY "Authenticated users can view tickets" ON support_tickets
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can create tickets" ON support_tickets
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update tickets" ON support_tickets
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Service role can access all support data" ON support_tickets
  FOR ALL USING (auth.role() = 'service_role');

-- Enable RLS on support_staff if not already enabled
ALTER TABLE support_staff ENABLE ROW LEVEL SECURITY;

-- Drop existing policies and create new ones for support_staff
DROP POLICY IF EXISTS "Authenticated users can view staff" ON support_staff;
DROP POLICY IF EXISTS "Authenticated users can create staff" ON support_staff;
DROP POLICY IF EXISTS "Authenticated users can update staff" ON support_staff;
DROP POLICY IF EXISTS "Service role can access all staff data" ON support_staff;

-- Create policies for support_staff
CREATE POLICY "Authenticated users can view staff" ON support_staff
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can create staff" ON support_staff
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update staff" ON support_staff
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Service role can access all staff data" ON support_staff
  FOR ALL USING (auth.role() = 'service_role');

-- Enable RLS on chat_sessions if not already enabled
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies and create new ones for chat_sessions
DROP POLICY IF EXISTS "Authenticated users can view chat sessions" ON chat_sessions;
DROP POLICY IF EXISTS "Authenticated users can create chat sessions" ON chat_sessions;
DROP POLICY IF EXISTS "Authenticated users can update chat sessions" ON chat_sessions;
DROP POLICY IF EXISTS "Service role can access all chat data" ON chat_sessions;

-- Create policies for chat_sessions
CREATE POLICY "Authenticated users can view chat sessions" ON chat_sessions
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can create chat sessions" ON chat_sessions
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update chat sessions" ON chat_sessions
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Service role can access all chat data" ON chat_sessions
  FOR ALL USING (auth.role() = 'service_role');

-- Enable RLS on chat_messages if not already enabled
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies and create new ones for chat_messages
DROP POLICY IF EXISTS "Authenticated users can view messages" ON chat_messages;
DROP POLICY IF EXISTS "Authenticated users can create messages" ON chat_messages;
DROP POLICY IF EXISTS "Authenticated users can update messages" ON chat_messages;
DROP POLICY IF EXISTS "Service role can access all message data" ON chat_messages;

-- Create policies for chat_messages
CREATE POLICY "Authenticated users can view messages" ON chat_messages
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can create messages" ON chat_messages
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update messages" ON chat_messages
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Service role can access all message data" ON chat_messages
  FOR ALL USING (auth.role() = 'service_role'); 