import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET() {
  try {
    const { data: partners, error } = await supabaseAdmin
      .from('partners')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching partners:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ partners: partners || [] });
  } catch (error: any) {
    console.error('General error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 