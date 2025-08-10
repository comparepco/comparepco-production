-- Create function to sync vehicle status with maintenance records
CREATE OR REPLACE FUNCTION sync_vehicle_maintenance_status()
RETURNS TRIGGER AS $$
BEGIN
    -- When maintenance is created or updated
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        -- If maintenance is in progress, set vehicle to maintenance status
        IF NEW.status = 'in_progress' THEN
            UPDATE public.vehicles 
            SET status = 'maintenance'
            WHERE id = NEW.car_id;
        END IF;
        
        -- If maintenance is completed, set vehicle back to available
        IF NEW.status = 'completed' THEN
            UPDATE public.vehicles 
            SET status = 'available'
            WHERE id = NEW.car_id;
        END IF;
        
        -- If maintenance is cancelled, set vehicle back to available
        IF NEW.status = 'cancelled' THEN
            UPDATE public.vehicles 
            SET status = 'available'
            WHERE id = NEW.car_id;
        END IF;
    END IF;
    
    -- When maintenance is deleted
    IF TG_OP = 'DELETE' THEN
        -- Set vehicle back to available if it was in maintenance
        UPDATE public.vehicles 
        SET status = 'available'
        WHERE id = OLD.car_id AND status = 'maintenance';
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically sync vehicle status
DROP TRIGGER IF EXISTS trigger_sync_vehicle_maintenance_status ON public.maintenance_records;
CREATE TRIGGER trigger_sync_vehicle_maintenance_status
    AFTER INSERT OR UPDATE OR DELETE ON public.maintenance_records
    FOR EACH ROW
    EXECUTE FUNCTION sync_vehicle_maintenance_status();

-- Create function to get maintenance summary for dashboard
CREATE OR REPLACE FUNCTION get_maintenance_dashboard_stats(partner_uuid UUID)
RETURNS TABLE (
    total_maintenance INTEGER,
    scheduled_count INTEGER,
    in_progress_count INTEGER,
    completed_count INTEGER,
    overdue_count INTEGER,
    cancelled_count INTEGER,
    total_cost DECIMAL(10,2),
    estimated_cost DECIMAL(10,2),
    upcoming_count INTEGER,
    this_month_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::INTEGER as total_maintenance,
        COUNT(CASE WHEN mr.status = 'scheduled' THEN 1 END)::INTEGER as scheduled_count,
        COUNT(CASE WHEN mr.status = 'in_progress' THEN 1 END)::INTEGER as in_progress_count,
        COUNT(CASE WHEN mr.status = 'completed' THEN 1 END)::INTEGER as completed_count,
        COUNT(CASE WHEN mr.status = 'overdue' THEN 1 END)::INTEGER as overdue_count,
        COUNT(CASE WHEN mr.status = 'cancelled' THEN 1 END)::INTEGER as cancelled_count,
        COALESCE(SUM(CASE WHEN mr.status = 'completed' THEN mr.cost ELSE 0 END), 0)::DECIMAL(10,2) as total_cost,
        COALESCE(SUM(mr.estimated_cost), 0)::DECIMAL(10,2) as estimated_cost,
        COUNT(CASE WHEN mr.status = 'scheduled' AND mr.scheduled_date > CURRENT_DATE THEN 1 END)::INTEGER as upcoming_count,
        COUNT(CASE WHEN mr.scheduled_date >= DATE_TRUNC('month', CURRENT_DATE) AND mr.scheduled_date < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' THEN 1 END)::INTEGER as this_month_count
    FROM public.maintenance_records mr
    WHERE mr.partner_id = partner_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get vehicle status summary
CREATE OR REPLACE FUNCTION get_vehicle_status_summary(partner_uuid UUID)
RETURNS TABLE (
    total_vehicles INTEGER,
    available_count INTEGER,
    booked_count INTEGER,
    maintenance_count INTEGER,
    inactive_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::INTEGER as total_vehicles,
        COUNT(CASE WHEN v.status = 'available' THEN 1 END)::INTEGER as available_count,
        COUNT(CASE WHEN v.status = 'booked' THEN 1 END)::INTEGER as booked_count,
        COUNT(CASE WHEN v.status = 'maintenance' THEN 1 END)::INTEGER as maintenance_count,
        COUNT(CASE WHEN v.status = 'inactive' THEN 1 END)::INTEGER as inactive_count
    FROM public.vehicles v
    WHERE v.partner_id = partner_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create view for maintenance alerts
CREATE OR REPLACE VIEW maintenance_alerts AS
SELECT 
    mr.partner_id,
    mr.id,
    mr.car_name,
    mr.car_plate,
    mr.title,
    mr.scheduled_date,
    mr.status,
    CASE 
        WHEN mr.status = 'overdue' THEN 'overdue'
        WHEN mr.status = 'scheduled' AND mr.scheduled_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days' THEN 'upcoming'
        ELSE 'normal'
    END as alert_type,
    CASE 
        WHEN mr.status = 'overdue' THEN CURRENT_DATE - mr.scheduled_date
        WHEN mr.status = 'scheduled' THEN mr.scheduled_date - CURRENT_DATE
        ELSE 0
    END as days_difference
FROM public.maintenance_records mr
WHERE mr.status IN ('overdue', 'scheduled')
AND mr.scheduled_date BETWEEN CURRENT_DATE - INTERVAL '30 days' AND CURRENT_DATE + INTERVAL '30 days';

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_maintenance_dashboard_stats(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_vehicle_status_summary(UUID) TO authenticated;
GRANT SELECT ON maintenance_alerts TO authenticated;

-- Add comments
COMMENT ON FUNCTION sync_vehicle_maintenance_status() IS 'Automatically syncs vehicle status with maintenance record status';
COMMENT ON FUNCTION get_maintenance_dashboard_stats(UUID) IS 'Returns maintenance statistics for dashboard';
COMMENT ON FUNCTION get_vehicle_status_summary(UUID) IS 'Returns vehicle status summary for dashboard';
COMMENT ON VIEW maintenance_alerts IS 'View for maintenance alerts and notifications'; 