import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const staffId = searchParams.get('staff_id');
    const date = searchParams.get('date');
    const period = searchParams.get('period') || '7d'; // 7d, 30d, 90d

    let query = supabase
      .from('support_performance')
      .select('*')
      .order('date', { ascending: false });

    if (staffId) {
      query = query.eq('staff_id', staffId);
    }
    if (date) {
      query = query.eq('date', date);
    }

    const { data: performanceData, error: perfError } = await query;

    if (perfError) throw perfError;

    // Get overall statistics
    const { data: tickets, error: ticketsError } = await supabase
      .from('support_tickets')
      .select('status, priority, response_time_minutes, satisfaction_rating, created_at');

    if (ticketsError) throw ticketsError;

    const { data: chats, error: chatsError } = await supabase
      .from('chat_sessions')
      .select('status, priority, waiting_time_minutes, session_duration_minutes, satisfaction_rating, created_at');

    if (chatsError) throw chatsError;

    const { data: staff, error: staffError } = await supabase
      .from('support_staff')
      .select('is_online, is_available, current_chats, total_chats_handled, total_tickets_handled, average_response_time_minutes, average_satisfaction_rating');

    if (staffError) throw staffError;

    // Calculate performance metrics
    const now = new Date();
    const periodStart = new Date();
    if (period === '7d') {
      periodStart.setDate(now.getDate() - 7);
    } else if (period === '30d') {
      periodStart.setDate(now.getDate() - 30);
    } else if (period === '90d') {
      periodStart.setDate(now.getDate() - 90);
    }

    const recentTickets = tickets?.filter(t => new Date(t.created_at) >= periodStart) || [];
    const recentChats = chats?.filter(c => new Date(c.created_at) >= periodStart) || [];

    const metrics = {
      totalTickets: recentTickets.length,
      openTickets: recentTickets.filter(t => t.status === 'open').length,
      resolvedTickets: recentTickets.filter(t => t.status === 'resolved').length,
      urgentTickets: recentTickets.filter(t => t.priority === 'urgent').length,
      averageResponseTime: recentTickets.length > 0 
        ? recentTickets.reduce((sum, t) => sum + (t.response_time_minutes || 0), 0) / recentTickets.length 
        : 0,
      averageSatisfaction: recentTickets.length > 0
        ? recentTickets.reduce((sum, t) => sum + (t.satisfaction_rating || 0), 0) / recentTickets.length
        : 0,
      totalChats: recentChats.length,
      activeChats: recentChats.filter(c => c.status === 'active').length,
      waitingChats: recentChats.filter(c => c.status === 'waiting').length,
      averageWaitTime: recentChats.length > 0
        ? recentChats.reduce((sum, c) => sum + (c.waiting_time_minutes || 0), 0) / recentChats.length
        : 0,
      averageSessionDuration: recentChats.length > 0
        ? recentChats.reduce((sum, c) => sum + (c.session_duration_minutes || 0), 0) / recentChats.length
        : 0,
      onlineStaff: staff?.filter(s => s.is_online).length || 0,
      availableStaff: staff?.filter(s => s.is_available).length || 0,
      totalStaff: staff?.length || 0,
      averageStaffSatisfaction: staff?.length > 0
        ? staff.reduce((sum, s) => sum + (s.average_satisfaction_rating || 0), 0) / staff.length
        : 0
    };

    return NextResponse.json({
      success: true,
      performance: performanceData,
      metrics,
      period
    });

  } catch (error) {
    console.error('Error fetching performance data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch performance data' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { staff_id, date, tickets_handled, chats_handled, average_response_time_minutes, average_satisfaction_rating, online_hours } = body;

    if (!staff_id || !date) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('support_performance')
      .upsert({
        staff_id,
        date,
        tickets_handled: tickets_handled || 0,
        chats_handled: chats_handled || 0,
        average_response_time_minutes: average_response_time_minutes || 0,
        average_satisfaction_rating: average_satisfaction_rating || 0,
        total_satisfaction_ratings: 0,
        online_hours: online_hours || 0
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      performance: data
    });
  } catch (error) {
    console.error('Error creating performance record:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create performance record' },
      { status: 500 }
    );
  }
} 