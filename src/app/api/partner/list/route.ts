import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  try {
    // Get all partners for debugging
    const { data: partners, error } = await supabaseAdmin
      .from('partners')
      .select('id, user_id, company_name, email, is_active')
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Error fetching partners:', error);
      return NextResponse.json({ error: 'Failed to fetch partners' }, { status: 500 });
    }

    return NextResponse.json({ 
      partners: partners || [],
      count: partners?.length || 0
    });
  } catch (error) {
    console.error('List partners error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 