-- Create maintenance_records table
CREATE TABLE IF NOT EXISTS public.maintenance_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    partner_id UUID NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
    car_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
    car_name TEXT NOT NULL,
    car_plate TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('service', 'repair', 'mot', 'insurance', 'inspection', 'other')),
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled', 'overdue')),
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    scheduled_date DATE NOT NULL,
    completed_date DATE,
    cost DECIMAL(10,2) DEFAULT 0,
    estimated_cost DECIMAL(10,2) DEFAULT 0,
    mileage INTEGER DEFAULT 0,
    next_service_mileage INTEGER,
    provider JSONB DEFAULT '{"name": "", "contact": "", "address": "", "rating": null}'::jsonb,
    parts JSONB DEFAULT '[]'::jsonb,
    attachments JSONB DEFAULT '[]'::jsonb,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_maintenance_records_partner_id ON public.maintenance_records(partner_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_records_car_id ON public.maintenance_records(car_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_records_status ON public.maintenance_records(status);
CREATE INDEX IF NOT EXISTS idx_maintenance_records_scheduled_date ON public.maintenance_records(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_maintenance_records_type ON public.maintenance_records(type);
CREATE INDEX IF NOT EXISTS idx_maintenance_records_priority ON public.maintenance_records(priority);

-- Enable RLS
ALTER TABLE public.maintenance_records ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- SELECT policy: Partners and their staff can view their own maintenance records
CREATE POLICY "Partners and staff can view their own maintenance records" ON public.maintenance_records
    FOR SELECT USING (
        partner_id IN (
            SELECT id FROM public.partners WHERE user_id = auth.uid()
            UNION
            SELECT partner_id FROM public.partner_staff WHERE user_id = auth.uid()
        )
        OR
        EXISTS (
            SELECT 1 FROM public.partner_staff 
            WHERE user_id = auth.uid() AND partner_id = public.maintenance_records.partner_id
        )
        OR
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE id = auth.uid() AND role = 'ADMIN'
        )
        OR
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE id = auth.uid() AND role = 'SUPER_ADMIN'
        )
    );

-- INSERT policy: Partners and their staff can create maintenance records for their partner
CREATE POLICY "Partners and staff can create maintenance records" ON public.maintenance_records
    FOR INSERT WITH CHECK (
        partner_id IN (
            SELECT id FROM public.partners WHERE user_id = auth.uid()
            UNION
            SELECT partner_id FROM public.partner_staff WHERE user_id = auth.uid()
        )
        OR
        EXISTS (
            SELECT 1 FROM public.partner_staff 
            WHERE user_id = auth.uid() AND partner_id = public.maintenance_records.partner_id
        )
        OR
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE id = auth.uid() AND role = 'ADMIN'
        )
        OR
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE id = auth.uid() AND role = 'SUPER_ADMIN'
        )
    );

-- UPDATE policy: Partners and their staff can update their own maintenance records
CREATE POLICY "Partners and staff can update their own maintenance records" ON public.maintenance_records
    FOR UPDATE USING (
        partner_id IN (
            SELECT id FROM public.partners WHERE user_id = auth.uid()
            UNION
            SELECT partner_id FROM public.partner_staff WHERE user_id = auth.uid()
        )
        OR
        EXISTS (
            SELECT 1 FROM public.partner_staff 
            WHERE user_id = auth.uid() AND partner_id = public.maintenance_records.partner_id
        )
        OR
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE id = auth.uid() AND role = 'ADMIN'
        )
        OR
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE id = auth.uid() AND role = 'SUPER_ADMIN'
        )
    );

-- DELETE policy: Partners and their staff can delete their own maintenance records
CREATE POLICY "Partners and staff can delete their own maintenance records" ON public.maintenance_records
    FOR DELETE USING (
        partner_id IN (
            SELECT id FROM public.partners WHERE user_id = auth.uid()
            UNION
            SELECT partner_id FROM public.partner_staff WHERE user_id = auth.uid()
        )
        OR
        EXISTS (
            SELECT 1 FROM public.partner_staff 
            WHERE user_id = auth.uid() AND partner_id = public.maintenance_records.partner_id
        )
        OR
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE id = auth.uid() AND role = 'ADMIN'
        )
        OR
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE id = auth.uid() AND role = 'SUPER_ADMIN'
        )
    );

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_maintenance_records_updated_at 
    BEFORE UPDATE ON public.maintenance_records 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE public.maintenance_records IS 'Maintenance records for partner vehicles';
COMMENT ON COLUMN public.maintenance_records.partner_id IS 'Reference to the partner who owns this maintenance record';
COMMENT ON COLUMN public.maintenance_records.car_id IS 'Reference to the vehicle being maintained';
COMMENT ON COLUMN public.maintenance_records.car_name IS 'Display name of the vehicle';
COMMENT ON COLUMN public.maintenance_records.car_plate IS 'License plate of the vehicle';
COMMENT ON COLUMN public.maintenance_records.type IS 'Type of maintenance (service, repair, mot, insurance, inspection, other)';
COMMENT ON COLUMN public.maintenance_records.status IS 'Current status of the maintenance (scheduled, in_progress, completed, cancelled, overdue)';
COMMENT ON COLUMN public.maintenance_records.priority IS 'Priority level (low, medium, high, urgent)';
COMMENT ON COLUMN public.maintenance_records.provider IS 'JSON object containing service provider information';
COMMENT ON COLUMN public.maintenance_records.parts IS 'JSON array of parts used in maintenance';
COMMENT ON COLUMN public.maintenance_records.attachments IS 'JSON array of file attachments'; 