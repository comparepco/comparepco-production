import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // resolve partner_id
    const { data: staffRow } = await supabaseAdmin
      .from('partner_staff')
      .select('partner_id')
      .eq('user_id', userId)
      .single()

    let partner_id = staffRow?.partner_id as string | null

    if (!partner_id) {
      const { data: partnerRow } = await supabaseAdmin
        .from('partners')
        .select('id')
        .eq('user_id', userId)
        .single()
      partner_id = partnerRow?.id as string | null
    }

    if (!partner_id) {
      return NextResponse.json({ error: 'Partner not found' }, { status: 404 })
    }

    const { data, error } = await supabaseAdmin
      .from('payment_instructions')
      .select('*')
      .eq('partner_id', partner_id)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ instructions: data })
  } catch (error) {
    console.error('Get payment instructions error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 