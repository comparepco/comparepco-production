import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json({ error: 'Server configuration missing' }, { status: 500 });
    }

    // Create admin client with service role
    const adminSupabase = createClient(supabaseUrl, serviceKey);

    // Fetch drivers with user data
    const { data: drivers, error: driversError } = await adminSupabase
      .from('drivers')
      .select(`
        *,
        user:users(
          id,
          email,
          first_name,
          last_name,
          phone,
          role,
          created_at
        )
      `)
      .order('created_at', { ascending: false });

    if (driversError) {
      console.error('Error fetching drivers:', driversError);
      return NextResponse.json({ error: driversError.message }, { status: 500 });
    }

    // Process drivers like the admin page does
    const enrichedDrivers = drivers.map(driver => {
      const userData = driver.user;
      return {
        ...driver,
        email: userData?.email || driver.email,
        full_name: userData ? `${userData.first_name || ''} ${userData.last_name || ''}`.trim() : driver.full_name,
        phone: userData?.phone || driver.phone,
        role: userData?.role || driver.role,
        created_at: userData?.created_at || driver.created_at,
        bookings: [],
        source: 'drivers'
      };
    });

    return NextResponse.json({ 
      drivers: enrichedDrivers,
      count: enrichedDrivers.length 
    });

  } catch (error: any) {
    console.error('Server error:', error);
    return NextResponse.json({ error: error?.message || 'Unexpected error' }, { status: 500 });
  }
} 