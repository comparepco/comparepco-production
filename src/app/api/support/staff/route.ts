import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const department = searchParams.get('department');
    const role = searchParams.get('role');
    const isAvailable = searchParams.get('is_available');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = supabase
      .from('support_staff')
      .select(`
        *,
        user:user_id(name, email)
      `)
      .order('name')
      .range(offset, offset + limit - 1);

    if (department) {
      query = query.eq('department', department);
    }
    if (role) {
      query = query.eq('role', role);
    }
    if (isAvailable !== null) {
      query = query.eq('is_available', isAvailable === 'true');
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({
      success: true,
      staff: data
    });
  } catch (error) {
    console.error('Error fetching support staff:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch support staff' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      user_id, 
      name, 
      email, 
      role, 
      department, 
      specializations,
      max_concurrent_chats,
      working_hours 
    } = body;

    if (!user_id || !name || !email || !role || !department) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('support_staff')
      .insert({
        user_id,
        name,
        email,
        role,
        department,
        specializations: specializations || [],
        max_concurrent_chats: max_concurrent_chats || 5,
        working_hours: working_hours || { start: "09:00", end: "17:00", timezone: "Europe/London" },
        is_available: true,
        is_online: false,
        current_chats: 0,
        total_chats_handled: 0,
        total_tickets_handled: 0,
        average_response_time_minutes: 0,
        average_satisfaction_rating: 5.00
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      staff: data
    });
  } catch (error) {
    console.error('Error creating support staff:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create support staff' },
      { status: 500 }
    );
  }
} 