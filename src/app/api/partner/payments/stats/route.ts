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
    const { data: staff } = await supabaseAdmin.from('partner_staff').select('partner_id').eq('user_id', userId).single()
    let partner_id = staff?.partner_id as string | null
    if (!partner_id) {
      const { data: par } = await supabaseAdmin.from('partners').select('id').eq('user_id', userId).single()
      partner_id = par?.id || null
    }
    if (!partner_id) return NextResponse.json({ error: 'Partner not found' }, { status: 404 })

    const { data, error } = await supabaseAdmin.rpc('payment_instruction_stats', { p_partner: partner_id })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ stats: data?.[0] || {} })
  } catch (error) {
    console.error('Get payment stats error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 