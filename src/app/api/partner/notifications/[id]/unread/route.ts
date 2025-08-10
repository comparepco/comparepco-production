import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Get partner ID from user
    const { data: partner, error: partnerError } = await supabaseAdmin
      .from('partners')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (partnerError || !partner) {
      return NextResponse.json({ error: 'Partner not found' }, { status: 404 });
    }

    // Mark notification as unread
    const { data: notification, error } = await supabaseAdmin
      .from('notifications')
      .update({ is_read: false })
      .eq('id', params.id)
      .eq('partner_id', partner.id) // Ensure partner owns this notification
      .select()
      .single();

    if (error) {
      console.error('Error marking notification as unread:', error);
      return NextResponse.json({ error: 'Failed to mark notification as unread' }, { status: 500 });
    }

    if (!notification) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, notification });
  } catch (error) {
    console.error('Error marking notification as unread:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 