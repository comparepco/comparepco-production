-- Create comprehensive customer support system
-- This migration creates all necessary tables for the support system

-- 1. Support Tickets Table
CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  user_type TEXT NOT NULL CHECK (user_type IN ('driver', 'partner', 'customer', 'admin')),
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('technical', 'billing', 'account', 'vehicle', 'booking', 'payment', 'documentation', 'general')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  assigned_to UUID REFERENCES auth.users(id),
  assigned_at TIMESTAMP WITH TIME ZONE,
  resolved_at TIMESTAMP WITH TIME ZONE,
  response_time_minutes INTEGER,
  satisfaction_rating INTEGER CHECK (satisfaction_rating >= 1 AND satisfaction_rating <= 5),
  satisfaction_comment TEXT,
  tags TEXT[],
  internal_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Chat Sessions Table
CREATE TABLE IF NOT EXISTS chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_type TEXT NOT NULL CHECK (customer_type IN ('driver', 'partner', 'customer')),
  agent_id UUID REFERENCES auth.users(id),
  category TEXT NOT NULL CHECK (category IN ('technical', 'billing', 'account', 'vehicle', 'booking', 'payment', 'documentation', 'general')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'active', 'completed', 'closed')),
  subject TEXT,
  assigned_at TIMESTAMP WITH TIME ZONE,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  waiting_time_minutes INTEGER,
  session_duration_minutes INTEGER,
  message_count INTEGER DEFAULT 0,
  satisfaction_rating INTEGER CHECK (satisfaction_rating >= 1 AND satisfaction_rating <= 5),
  satisfaction_comment TEXT,
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Chat Messages Table
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('customer', 'agent', 'system')),
  message TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'file', 'image', 'system')),
  file_url TEXT,
  file_name TEXT,
  file_size INTEGER,
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Support Staff Table
CREATE TABLE IF NOT EXISTS support_staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('support_agent', 'supervisor', 'manager', 'admin')),
  department TEXT NOT NULL CHECK (department IN ('customer_support', 'technical_support', 'billing', 'operations', 'management')),
  specializations TEXT[],
  is_available BOOLEAN DEFAULT TRUE,
  is_online BOOLEAN DEFAULT FALSE,
  current_chats INTEGER DEFAULT 0,
  max_concurrent_chats INTEGER DEFAULT 5,
  total_chats_handled INTEGER DEFAULT 0,
  total_tickets_handled INTEGER DEFAULT 0,
  average_response_time_minutes INTEGER DEFAULT 0,
  average_satisfaction_rating DECIMAL(3,2) DEFAULT 5.00,
  working_hours JSONB DEFAULT '{"start": "09:00", "end": "17:00", "timezone": "Europe/London"}',
  join_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Quick Response Templates Table
CREATE TABLE IF NOT EXISTS quick_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('driver', 'partner', 'technical', 'billing', 'general')),
  subcategory TEXT,
  tags TEXT[],
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Support Notifications Table
CREATE TABLE IF NOT EXISTS support_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('ticket_assigned', 'chat_assigned', 'ticket_updated', 'chat_message', 'urgent_alert', 'performance_alert')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Support Performance Metrics Table
CREATE TABLE IF NOT EXISTS support_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID REFERENCES support_staff(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  tickets_handled INTEGER DEFAULT 0,
  chats_handled INTEGER DEFAULT 0,
  average_response_time_minutes INTEGER DEFAULT 0,
  average_satisfaction_rating DECIMAL(3,2) DEFAULT 0.00,
  total_satisfaction_ratings INTEGER DEFAULT 0,
  online_hours DECIMAL(5,2) DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_priority ON support_tickets(priority);
CREATE INDEX IF NOT EXISTS idx_support_tickets_assigned_to ON support_tickets(assigned_to);
CREATE INDEX IF NOT EXISTS idx_support_tickets_created_at ON support_tickets(created_at);

CREATE INDEX IF NOT EXISTS idx_chat_sessions_customer_id ON chat_sessions(customer_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_status ON chat_sessions(status);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_agent_id ON chat_sessions(agent_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_created_at ON chat_sessions(created_at);

CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON chat_messages(chat_session_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender_id ON chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);

CREATE INDEX IF NOT EXISTS idx_support_staff_user_id ON support_staff(user_id);
CREATE INDEX IF NOT EXISTS idx_support_staff_is_available ON support_staff(is_available);
CREATE INDEX IF NOT EXISTS idx_support_staff_role ON support_staff(role);

CREATE INDEX IF NOT EXISTS idx_support_notifications_user_id ON support_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_support_notifications_is_read ON support_notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_support_notifications_created_at ON support_notifications(created_at);

-- Create functions for automatic updates
CREATE OR REPLACE FUNCTION update_support_ticket_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_chat_session_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_support_staff_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER trigger_support_tickets_updated_at
  BEFORE UPDATE ON support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION update_support_ticket_updated_at();

CREATE TRIGGER trigger_chat_sessions_updated_at
  BEFORE UPDATE ON chat_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_chat_session_updated_at();

CREATE TRIGGER trigger_support_staff_updated_at
  BEFORE UPDATE ON support_staff
  FOR EACH ROW
  EXECUTE FUNCTION update_support_staff_updated_at();

-- Create function to calculate response time
CREATE OR REPLACE FUNCTION calculate_response_time()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.assigned_at IS NOT NULL AND OLD.assigned_at IS NULL THEN
    NEW.response_time_minutes = EXTRACT(EPOCH FROM (NEW.assigned_at - NEW.created_at)) / 60;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calculate_response_time
  BEFORE UPDATE ON support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION calculate_response_time();

-- Create function to update chat session message count
CREATE OR REPLACE FUNCTION update_chat_message_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE chat_sessions 
    SET message_count = message_count + 1,
        updated_at = NOW()
    WHERE id = NEW.chat_session_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE chat_sessions 
    SET message_count = message_count - 1,
        updated_at = NOW()
    WHERE id = OLD.chat_session_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_chat_message_count
  AFTER INSERT OR DELETE ON chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_chat_message_count();

-- Enable Row Level Security
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE quick_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_performance ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for support_tickets
CREATE POLICY "Users can view their own tickets" ON support_tickets
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own tickets" ON support_tickets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tickets" ON support_tickets
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Support staff can view all tickets" ON support_tickets
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM support_staff 
      WHERE support_staff.user_id = auth.uid()
    )
  );

CREATE POLICY "Support staff can update tickets" ON support_tickets
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM support_staff 
      WHERE support_staff.user_id = auth.uid()
    )
  );

-- Create RLS policies for chat_sessions
CREATE POLICY "Users can view their own chat sessions" ON chat_sessions
  FOR SELECT USING (auth.uid() = customer_id OR auth.uid() = agent_id);

CREATE POLICY "Users can create chat sessions" ON chat_sessions
  FOR INSERT WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Support staff can view all chat sessions" ON chat_sessions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM support_staff 
      WHERE support_staff.user_id = auth.uid()
    )
  );

CREATE POLICY "Support staff can update chat sessions" ON chat_sessions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM support_staff 
      WHERE support_staff.user_id = auth.uid()
    )
  );

-- Create RLS policies for chat_messages
CREATE POLICY "Users can view messages in their chat sessions" ON chat_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM chat_sessions 
      WHERE chat_sessions.id = chat_messages.chat_session_id 
      AND (chat_sessions.customer_id = auth.uid() OR chat_sessions.agent_id = auth.uid())
    )
  );

CREATE POLICY "Users can send messages in their chat sessions" ON chat_messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM chat_sessions 
      WHERE chat_sessions.id = chat_messages.chat_session_id 
      AND (chat_sessions.customer_id = auth.uid() OR chat_sessions.agent_id = auth.uid())
    )
  );

-- Create RLS policies for support_staff
CREATE POLICY "Support staff can view their own records" ON support_staff
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Support staff can update their own records" ON support_staff
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all support staff" ON support_staff
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.raw_user_meta_data->>'role' IN ('SUPER_ADMIN', 'ADMIN')
    )
  );

CREATE POLICY "Admins can manage support staff" ON support_staff
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.raw_user_meta_data->>'role' IN ('SUPER_ADMIN', 'ADMIN')
    )
  );

-- Create RLS policies for support_notifications
CREATE POLICY "Users can view their own notifications" ON support_notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON support_notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Create RLS policies for other tables
CREATE POLICY "Support staff can view quick responses" ON quick_responses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM support_staff 
      WHERE support_staff.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage quick responses" ON quick_responses
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.raw_user_meta_data->>'role' IN ('SUPER_ADMIN', 'ADMIN')
    )
  );

-- Insert sample quick responses
INSERT INTO quick_responses (title, content, category, subcategory, tags, created_by) VALUES
('Welcome Message', 'Hello! Thank you for contacting ComparePCO support. How can I help you today?', 'general', 'greeting', ARRAY['welcome', 'greeting'], NULL),
('Account Verification', 'To verify your account, please provide your PCO license and proof of address. You can upload these documents in your account settings.', 'driver', 'verification', ARRAY['verification', 'documents'], NULL),
('Vehicle Booking Issue', 'I understand you''re having trouble with your vehicle booking. Let me check the details and get this resolved for you.', 'driver', 'booking', ARRAY['booking', 'vehicle'], NULL),
('Payment Processing', 'For payment issues, please check that your card details are correct and that you have sufficient funds. If the problem persists, we can investigate further.', 'driver', 'payment', ARRAY['payment', 'billing'], NULL),
('Partner Onboarding', 'Welcome to ComparePCO! To complete your partner onboarding, please provide your business registration documents and fleet information.', 'partner', 'onboarding', ARRAY['onboarding', 'business'], NULL),
('Fleet Management', 'For fleet management issues, please provide details about the specific vehicle and the problem you''re experiencing.', 'partner', 'fleet', ARRAY['fleet', 'vehicle'], NULL),
('Technical Issue', 'I''m sorry to hear you''re experiencing technical difficulties. Let me help you troubleshoot this issue.', 'technical', 'general', ARRAY['technical', 'troubleshooting'], NULL),
('Billing Inquiry', 'I''ll help you with your billing inquiry. Please provide your account details so I can assist you properly.', 'billing', 'general', ARRAY['billing', 'payment'], NULL);

-- Refresh schema cache
NOTIFY pgrst, 'reload schema'; 