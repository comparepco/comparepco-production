-- Create calendar_events table
CREATE TABLE IF NOT EXISTS calendar_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    partner_id UUID REFERENCES partners(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    type TEXT NOT NULL DEFAULT 'custom',
    status TEXT NOT NULL DEFAULT 'scheduled',
    priority TEXT NOT NULL DEFAULT 'medium',
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
    driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL,
    booking_id UUID,
    maintenance_id UUID,
    location TEXT,
    notes TEXT,
    reminder_days INTEGER DEFAULT 1,
    recurring TEXT DEFAULT 'none',
    recurring_end_date DATE,
    created_by UUID NOT NULL,
    assigned_to UUID,
    attendees TEXT[] DEFAULT '{}',
    is_team_event BOOLEAN DEFAULT false,
    meeting_link TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_calendar_events_partner_id ON calendar_events(partner_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_created_by ON calendar_events(created_by);
CREATE INDEX IF NOT EXISTS idx_calendar_events_assigned_to ON calendar_events(assigned_to);
CREATE INDEX IF NOT EXISTS idx_calendar_events_start_date ON calendar_events(start_date);
CREATE INDEX IF NOT EXISTS idx_calendar_events_type ON calendar_events(type);
CREATE INDEX IF NOT EXISTS idx_calendar_events_status ON calendar_events(status);

-- Enable RLS
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own calendar events" ON calendar_events
    FOR SELECT USING (
        created_by = auth.uid() OR 
        assigned_to = auth.uid() OR 
        partner_id = auth.uid() OR
        attendees @> ARRAY[auth.uid()::text]
    );

CREATE POLICY "Users can create their own calendar events" ON calendar_events
    FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update their own calendar events" ON calendar_events
    FOR UPDATE USING (created_by = auth.uid());

CREATE POLICY "Users can delete their own calendar events" ON calendar_events
    FOR DELETE USING (created_by = auth.uid());

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_calendar_events_updated_at 
    BEFORE UPDATE ON calendar_events 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column(); 