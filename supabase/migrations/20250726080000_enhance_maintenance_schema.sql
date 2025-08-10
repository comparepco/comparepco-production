-- Enhance maintenance_records table with additional fields and constraints
ALTER TABLE public.maintenance_records 
ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
ADD COLUMN IF NOT EXISTS estimated_cost DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS next_service_mileage INTEGER,
ADD COLUMN IF NOT EXISTS provider JSONB DEFAULT '{"name": "", "contact": "", "address": "", "rating": null}'::jsonb,
ADD COLUMN IF NOT EXISTS parts JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add missing indexes for better performance
CREATE INDEX IF NOT EXISTS idx_maintenance_records_priority ON public.maintenance_records(priority);
CREATE INDEX IF NOT EXISTS idx_maintenance_records_created_by ON public.maintenance_records(created_by);
CREATE INDEX IF NOT EXISTS idx_maintenance_records_created_at ON public.maintenance_records(created_at);

-- Ensure vehicles table has all required fields for maintenance
ALTER TABLE public.vehicles 
ADD COLUMN IF NOT EXISTS mileage INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_service_date DATE,
ADD COLUMN IF NOT EXISTS next_service_date DATE,
ADD COLUMN IF NOT EXISTS last_service_mileage INTEGER DEFAULT 0;

-- Create function to update vehicle service information
CREATE OR REPLACE FUNCTION update_vehicle_service_info()
RETURNS TRIGGER AS $$
BEGIN
    -- Update vehicle mileage when maintenance is completed
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        UPDATE public.vehicles 
        SET 
            mileage = GREATEST(vehicles.mileage, NEW.mileage),
            last_service_date = NEW.completed_date,
            last_service_mileage = NEW.mileage
        WHERE id = NEW.car_id;
    END IF;
    
    -- Update next service date when maintenance is scheduled
    IF NEW.status = 'scheduled' AND NEW.type = 'service' THEN
        UPDATE public.vehicles 
        SET next_service_date = NEW.scheduled_date
        WHERE id = NEW.car_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update vehicle service info
DROP TRIGGER IF EXISTS trigger_update_vehicle_service_info ON public.maintenance_records;
CREATE TRIGGER trigger_update_vehicle_service_info
    AFTER INSERT OR UPDATE ON public.maintenance_records
    FOR EACH ROW
    EXECUTE FUNCTION update_vehicle_service_info();

-- Create function to check for overdue maintenance
CREATE OR REPLACE FUNCTION check_overdue_maintenance()
RETURNS TRIGGER AS $$
BEGIN
    -- Auto-update status to overdue if scheduled date has passed
    IF NEW.status = 'scheduled' AND NEW.scheduled_date < CURRENT_DATE THEN
        NEW.status := 'overdue';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically check for overdue maintenance
DROP TRIGGER IF EXISTS trigger_check_overdue_maintenance ON public.maintenance_records;
CREATE TRIGGER trigger_check_overdue_maintenance
    BEFORE INSERT OR UPDATE ON public.maintenance_records
    FOR EACH ROW
    EXECUTE FUNCTION check_overdue_maintenance();

-- Create view for maintenance summary
CREATE OR REPLACE VIEW maintenance_summary AS
SELECT 
    mr.partner_id,
    p.company_name as partner_name,
    COUNT(*) as total_maintenance,
    COUNT(CASE WHEN mr.status = 'scheduled' THEN 1 END) as scheduled_count,
    COUNT(CASE WHEN mr.status = 'in_progress' THEN 1 END) as in_progress_count,
    COUNT(CASE WHEN mr.status = 'completed' THEN 1 END) as completed_count,
    COUNT(CASE WHEN mr.status = 'overdue' THEN 1 END) as overdue_count,
    SUM(CASE WHEN mr.status = 'completed' THEN mr.cost ELSE 0 END) as total_cost,
    AVG(CASE WHEN mr.status = 'completed' THEN mr.cost ELSE NULL END) as avg_cost
FROM public.maintenance_records mr
JOIN public.partners p ON mr.partner_id = p.id
GROUP BY mr.partner_id, p.company_name;

-- Create function to get maintenance alerts
CREATE OR REPLACE FUNCTION get_maintenance_alerts(partner_uuid UUID)
RETURNS TABLE (
    alert_type TEXT,
    count INTEGER,
    details JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        'overdue'::TEXT as alert_type,
        COUNT(*)::INTEGER as count,
        jsonb_agg(
            jsonb_build_object(
                'id', mr.id,
                'title', mr.title,
                'car_name', mr.car_name,
                'scheduled_date', mr.scheduled_date,
                'days_overdue', CURRENT_DATE - mr.scheduled_date
            )
        ) as details
    FROM public.maintenance_records mr
    WHERE mr.partner_id = partner_uuid 
    AND mr.status = 'overdue'
    
    UNION ALL
    
    SELECT 
        'upcoming'::TEXT as alert_type,
        COUNT(*)::INTEGER as count,
        jsonb_agg(
            jsonb_build_object(
                'id', mr.id,
                'title', mr.title,
                'car_name', mr.car_name,
                'scheduled_date', mr.scheduled_date,
                'days_until', mr.scheduled_date - CURRENT_DATE
            )
        ) as details
    FROM public.maintenance_records mr
    WHERE mr.partner_id = partner_uuid 
    AND mr.status = 'scheduled'
    AND mr.scheduled_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT SELECT ON maintenance_summary TO authenticated;
GRANT EXECUTE ON FUNCTION get_maintenance_alerts(UUID) TO authenticated;

-- Add comments for documentation
COMMENT ON FUNCTION update_vehicle_service_info() IS 'Updates vehicle service information when maintenance is completed';
COMMENT ON FUNCTION check_overdue_maintenance() IS 'Automatically marks maintenance as overdue if scheduled date has passed';
COMMENT ON VIEW maintenance_summary IS 'Summary view of maintenance records by partner';
COMMENT ON FUNCTION get_maintenance_alerts(UUID) IS 'Returns overdue and upcoming maintenance alerts for a partner'; 