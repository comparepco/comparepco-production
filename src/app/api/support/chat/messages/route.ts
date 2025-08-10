import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const chatSessionId = searchParams.get('chat_session_id');

    if (!chatSessionId) {
      return NextResponse.json(
        { success: false, error: 'Chat session ID is required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('chat_messages')
      .select(`
        *,
        sender:sender_id(name, email)
      `)
      .eq('chat_session_id', chatSessionId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    return NextResponse.json({
      success: true,
      messages: data
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { chat_session_id, sender_id, sender_type, message, message_type, file_url, file_name, file_size } = body;

    if (!chat_session_id || !sender_id || !sender_type || !message) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('chat_messages')
      .insert({
        chat_session_id,
        sender_id,
        sender_type,
        message,
        message_type: message_type || 'text',
        file_url,
        file_name,
        file_size
      })
      .select()
      .single();

    if (error) throw error;

    // Get the chat session
    const { data: session, error: sessionError } = await supabase
      .from('chat_sessions')
      .select('*')
      .eq('id', chat_session_id)
      .single();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Chat session not found' }, { status: 404 });
    }

    // Update chat session message count
    const { error: updateError } = await supabase
      .from('chat_sessions')
      .update({ 
        message_count: (session.message_count || 0) + 1,
        updated_at: new Date().toISOString()
      })
      .eq('id', chat_session_id);

    return NextResponse.json({
      success: true,
      message: data
    });
  } catch (error) {
    console.error('Error creating message:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create message' },
      { status: 500 }
    );
  }
} 