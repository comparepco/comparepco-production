-- Fix RLS policies for support system to allow proper access
-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can view their own tickets" ON support_tickets;
DROP POLICY IF EXISTS "Users can create their own tickets" ON support_tickets;
DROP POLICY IF EXISTS "Users can update their own tickets" ON support_tickets;
DROP POLICY IF EXISTS "Support staff can view all tickets" ON support_tickets;
DROP POLICY IF EXISTS "Support staff can update tickets" ON support_tickets;

DROP POLICY IF EXISTS "Users can view their own chat sessions" ON chat_sessions;
DROP POLICY IF EXISTS "Users can create chat sessions" ON chat_sessions;
DROP POLICY IF EXISTS "Support staff can view all chat sessions" ON chat_sessions;
DROP POLICY IF EXISTS "Support staff can update chat sessions" ON chat_sessions;

DROP POLICY IF EXISTS "Users can view messages in their chat sessions" ON chat_messages;
DROP POLICY IF EXISTS "Users can create messages in their chat sessions" ON chat_messages;
DROP POLICY IF EXISTS "Support staff can view all messages" ON chat_messages;
DROP POLICY IF EXISTS "Support staff can create messages" ON chat_messages;

-- Create more permissive policies for development and testing
-- Allow authenticated users to view and create tickets
CREATE POLICY "Authenticated users can view tickets" ON support_tickets
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can create tickets" ON support_tickets
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update tickets" ON support_tickets
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Allow authenticated users to view and create chat sessions
CREATE POLICY "Authenticated users can view chat sessions" ON chat_sessions
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can create chat sessions" ON chat_sessions
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update chat sessions" ON chat_sessions
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Allow authenticated users to view and create chat messages
CREATE POLICY "Authenticated users can view chat messages" ON chat_messages
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can create chat messages" ON chat_messages
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update chat messages" ON chat_messages
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Allow authenticated users to access support staff
CREATE POLICY "Authenticated users can view support staff" ON support_staff
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can create support staff" ON support_staff
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update support staff" ON support_staff
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Allow authenticated users to access quick responses
CREATE POLICY "Authenticated users can view quick responses" ON quick_responses
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can create quick responses" ON quick_responses
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update quick responses" ON quick_responses
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Allow authenticated users to access notifications
CREATE POLICY "Authenticated users can view notifications" ON support_notifications
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can create notifications" ON support_notifications
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update notifications" ON support_notifications
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Allow authenticated users to access performance data
CREATE POLICY "Authenticated users can view performance" ON support_performance
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can create performance" ON support_performance
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update performance" ON support_performance
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Also allow service role to access all tables (for admin operations)
CREATE POLICY "Service role can access all support data" ON support_tickets
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can access all chat sessions" ON chat_sessions
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can access all chat messages" ON chat_messages
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can access all support staff" ON support_staff
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can access all quick responses" ON quick_responses
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can access all notifications" ON support_notifications
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can access all performance" ON support_performance
  FOR ALL USING (auth.role() = 'service_role'); 