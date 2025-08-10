import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    console.log('Looking for partner with user_id:', userId);
    
    // Get partner record for the user
    const { data: partner, error } = await supabaseAdmin
      .from('partners')
      .select('id, user_id, company_name')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching partner:', error);
      return NextResponse.json({ error: 'Failed to fetch partner' }, { status: 500 });
    }

    if (!partner) {
      console.error('Partner not found for user_id:', userId);
      return NextResponse.json({ error: 'Partner not found' }, { status: 404 });
    }

    console.log('Found partner:', partner);
    return NextResponse.json({ partnerId: partner.id });
  } catch (error) {
    console.error('Get partner ID error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 