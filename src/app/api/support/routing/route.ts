import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ticket_id, chat_id, customer_type, category, priority } = body;

    if (!customer_type || !category || !priority) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Find available staff with capacity
    const { data: availableStaff, error: staffError } = await supabase
      .from('support_staff')
      .select('*')
      .eq('is_available', true)
      .eq('is_online', true)
      .lt('current_chats', supabase.rpc('get_max_concurrent_chats', { staff_id: 'id' }));

    if (staffError) throw staffError;

    if (!availableStaff || availableStaff.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No available staff members'
      }, { status: 503 });
    }

    // Intelligent routing logic
    let bestAgent = null;
    let bestScore = -1;

    for (const staff of availableStaff) {
      let score = 0;

      // Specialization matching
      if (staff.specializations && staff.specializations.includes(category)) {
        score += 10;
      }

      // Customer type matching
      if (customer_type === 'driver' && staff.specializations?.includes('driver_support')) {
        score += 5;
      } else if (customer_type === 'partner' && staff.specializations?.includes('partner_support')) {
        score += 5;
      }

      // Priority-based scoring
      if (priority === 'urgent') {
        score += 8;
      } else if (priority === 'high') {
        score += 6;
      } else if (priority === 'medium') {
        score += 4;
      } else {
        score += 2;
      }

      // Performance-based scoring
      score += (staff.average_satisfaction_rating || 5) * 2;
      score -= (staff.average_response_time_minutes || 0) / 10;

      // Workload balancing
      score -= staff.current_chats * 2;

      if (score > bestScore) {
        bestScore = score;
        bestAgent = staff;
      }
    }

    if (!bestAgent) {
      return NextResponse.json({
        success: false,
        error: 'No suitable agent found'
      }, { status: 503 });
    }

    // Assign the ticket or chat
    if (ticket_id) {
      const { error: ticketError } = await supabase
        .from('support_tickets')
        .update({
          assigned_to: bestAgent.user_id,
          assigned_at: new Date().toISOString(),
          status: 'in_progress'
        })
        .eq('id', ticket_id);

      if (ticketError) throw ticketError;

      // Create notification for assigned agent
      await supabase
        .from('support_notifications')
        .insert({
          user_id: bestAgent.user_id,
          type: 'ticket_assigned',
          title: 'New Ticket Assigned',
          message: `You have been assigned a new ${priority} priority ticket`,
          data: { ticket_id, category, priority }
        });

    } else if (chat_id) {
      const { error: chatError } = await supabase
        .from('chat_sessions')
        .update({
          agent_id: bestAgent.user_id,
          assigned_at: new Date().toISOString(),
          status: 'active',
          started_at: new Date().toISOString()
        })
        .eq('id', chat_id);

      if (chatError) throw chatError;

      // Update agent's current chat count
      await supabase
        .from('support_staff')
        .update({ current_chats: bestAgent.current_chats + 1 })
        .eq('id', bestAgent.id);

      // Create notification for assigned agent
      await supabase
        .from('support_notifications')
        .insert({
          user_id: bestAgent.user_id,
          type: 'chat_assigned',
          title: 'New Chat Assigned',
          message: `You have been assigned a new ${priority} priority chat`,
          data: { chat_id, category, priority }
        });
    }

    return NextResponse.json({
      success: true,
      assigned_agent: {
        id: bestAgent.id,
        name: bestAgent.name,
        email: bestAgent.email,
        role: bestAgent.role
      },
      score: bestScore
    });

  } catch (error) {
    console.error('Error in intelligent routing:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to assign ticket/chat' },
      { status: 500 }
    );
  }
} 