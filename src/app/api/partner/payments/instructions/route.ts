import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

// GET /api/partner/payments/instructions?bookingId=xxx&type=refund&partnerId=xxx&driverId=xxx&status=xxx
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const bookingId = searchParams.get('bookingId');
    const type = searchParams.get('type');
    const partnerId = searchParams.get('partnerId');
    const driverId = searchParams.get('driverId');
    const status = searchParams.get('status');

    // Build query
    let query = supabaseAdmin
      .from('payment_instructions')
      .select('*');

    // Apply filters
    if (bookingId) {
      query = query.eq('booking_id', bookingId);
    }
    if (type) {
      query = query.eq('type', type);
    }
    if (partnerId) {
      query = query.eq('partner_id', partnerId);
    }
    if (driverId) {
      query = query.eq('driver_id', driverId);
    }
    if (status) {
      query = query.eq('status', status);
    }

    // Get instructions
    const { data: instructions, error } = await query;

    if (error) {
      console.error('Error fetching payment instructions:', error);
      return NextResponse.json({ error: 'Failed to get instructions' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      instructions: instructions || [],
      count: instructions?.length || 0
    });

  } catch (error: any) {
    console.error('Get instructions error:', error);
    return NextResponse.json({ error: 'Failed to get instructions' }, { status: 500 });
  }
} 