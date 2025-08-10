-- Check if drivers table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'drivers'
) as table_exists;

-- If the above returns false, run the create_drivers_table.sql script 