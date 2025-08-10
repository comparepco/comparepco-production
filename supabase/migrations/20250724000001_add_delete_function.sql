-- Migration: Add delete function for partners
-- This function will delete both the partner record and the associated user

-- Create function to delete partner and associated user
CREATE OR REPLACE FUNCTION delete_partner_and_user(partner_id UUID)
RETURNS VOID AS $$
DECLARE
    user_id UUID;
BEGIN
    -- Get the user_id associated with this partner
    SELECT user_id INTO user_id FROM public.partners WHERE id = partner_id;
    
    -- Delete the partner record
    DELETE FROM public.partners WHERE id = partner_id;
    
    -- Delete the associated user from auth.users if it exists
    IF user_id IS NOT NULL THEN
        DELETE FROM auth.users WHERE id = user_id;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION delete_partner_and_user(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION delete_partner_and_user(UUID) TO service_role; 