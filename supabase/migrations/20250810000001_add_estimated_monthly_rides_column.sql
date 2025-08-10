-- Add estimated_monthly_rides column to partners table
-- This column is used by the partner registration forms

ALTER TABLE public.partners 
ADD COLUMN IF NOT EXISTS estimated_monthly_rides INTEGER DEFAULT 100;

-- Add comment for documentation
COMMENT ON COLUMN public.partners.estimated_monthly_rides IS 'Estimated number of monthly rides for the partner business'; 