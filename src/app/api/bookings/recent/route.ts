import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

// GET /api/bookings/recent?limit=1
export async function GET(req: NextRequest) {
  try {
    // Get limit from query params, default to 1
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '1', 10);

    // Query recent bookings first (larger sample), then filter
    const { data: initialBookings, error: initialError } = await supabaseAdmin
      .from('bookings')
      .select(`
        id,
        created_at,
        status,
        vehicle_id,
        car_id,
        driver,
        partner,
        car
      `)
      .order('created_at', { ascending: false })
      .limit(50); // get a reasonable sample to filter

    if (initialError) {
      console.error('Error fetching initial bookings:', initialError);
      return NextResponse.json({ error: 'Failed to fetch recent bookings' }, { status: 500 });
    }

    const allowedStatuses = ['pending', 'pending_partner_approval', 'pending_documents', 'active', 'confirmed', 'partner_accepted'];

    const valid: any[] = [];
    
    for (const booking of initialBookings || []) {
      if (!allowedStatuses.includes(booking.status)) continue;

      // ensure vehicle exists and is not removed
      const vehicleId = booking.vehicle_id || booking.car_id;
      if (!vehicleId) continue;

      const { data: vehicleData, error: vehicleError } = await supabaseAdmin
        .from('vehicles')
        .select('id, make, model, image_url, image_urls, price_per_week, weekly_rate, status')
        .eq('id', vehicleId)
        .single();

      if (vehicleError || !vehicleData) continue;
      if (['deleted', 'removed'].includes(vehicleData?.status)) continue;

      valid.push({
        id: booking.id,
        created_at: booking.created_at,
        car: {
          id: vehicleId,
          make: vehicleData?.make || '',
          model: vehicleData?.model || '',
          image: vehicleData?.image_url || (Array.isArray(vehicleData?.image_urls) ? vehicleData.image_urls[0] : ''),
          price_per_week: vehicleData?.price_per_week || vehicleData?.weekly_rate || '',
        },
        driver: booking.driver || {},
        partner: booking.partner || {},
        status: booking.status,
      });

      if (valid.length >= limit) break; // stop once limit reached
    }

    const bookings = valid;

    return NextResponse.json({ bookings });
  } catch (error) {
    console.error('Error fetching recent bookings:', error);
    return NextResponse.json({ error: 'Failed to fetch recent bookings' }, { status: 500 });
  }
} 