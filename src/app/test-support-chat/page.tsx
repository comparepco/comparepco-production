'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { toast } from 'react-hot-toast';

interface ChatSession {
  id: string;
  customer_id: string;
  customer_type: string;
  category: string;
  priority: string;
  status: string;
  subject: string;
  created_at: string;
  updated_at: string;
}

interface ChatMessage {
  id: string;
  chat_session_id: string;
  sender_id: string;
  sender_type: string;
  message_type: string;
  message: string; // Changed from 'content' to 'message'
  is_read: boolean;
  created_at: string;
}

export default function TestSupportChat() {
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [selectedChat, setSelectedChat] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadChatSessions();
    setupRealtimeSubscription();
  }, []);

  const loadChatSessions = async () => {
    try {
      // Use admin client to bypass RLS restrictions for testing
      const { data, error } = await supabaseAdmin
        .from('chat_sessions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Error loading chat sessions:', error);
        toast.error('Failed to load chat sessions');
        return;
      }

      setChatSessions(data || []);
    } catch (error) {
      console.error('Error loading chat sessions:', error);
      toast.error('Failed to load chat sessions');
    }
  };

  const loadMessages = async (chatId: string) => {
    try {
      // Use admin client to bypass RLS restrictions for testing
      const { data, error } = await supabaseAdmin
        .from('chat_messages')
        .select('*')
        .eq('chat_session_id', chatId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error loading messages:', error);
        toast.error('Failed to load messages');
        return;
      }

      setMessages(data || []);
    } catch (error) {
      console.error('Error loading messages:', error);
      toast.error('Failed to load messages');
    }
  };

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel('test_chat_realtime')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'chat_sessions' },
        (payload) => {
          console.log('Chat session update:', payload);
          loadChatSessions();
        }
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'chat_messages' },
        (payload) => {
          console.log('Message update:', payload);
          if (selectedChat) {
            loadMessages(selectedChat.id);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const createTestChat = async () => {
    try {
      setLoading(true);
      // Use admin client to bypass RLS restrictions for testing
      const { data, error } = await supabaseAdmin
        .from('chat_sessions')
        .insert({
          customer_id: 'eb69b174-96ae-444c-a2a8-7ad4cc9d8014', // Use existing test user
          customer_type: 'customer',
          category: 'general',
          priority: 'medium',
          subject: 'Test chat from browser',
          status: 'waiting'
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating chat:', error);
        toast.error('Failed to create chat session');
        return;
      }

      toast.success('Test chat session created!');
      loadChatSessions();
    } catch (error) {
      console.error('Error creating chat:', error);
      toast.error('Failed to create chat session');
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!selectedChat || !newMessage.trim()) return;

    try {
      setLoading(true);
      // Use admin client to bypass RLS restrictions for testing
      const { error } = await supabaseAdmin
        .from('chat_messages')
        .insert({
          chat_session_id: selectedChat.id,
          sender_id: 'eb69b174-96ae-444c-a2a8-7ad4cc9d8014', // Use existing test user
          sender_type: 'customer',
          message_type: 'text',
          message: newMessage, // Use correct column name
          is_read: false
        });

      if (error) {
        console.error('Error sending message:', error);
        toast.error('Failed to send message');
        return;
      }

      setNewMessage('');
      toast.success('Message sent!');
      loadMessages(selectedChat.id);
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  const selectChat = (chat: ChatSession) => {
    setSelectedChat(chat);
    loadMessages(chat.id);
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Support Chat Test</h1>
          <p className="text-gray-600 mb-4">Test the support chat functionality (using admin client)</p>
          
          <button
            onClick={createTestChat}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Test Chat Session'}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chat Sessions List */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Chat Sessions</h2>
            <div className="space-y-2">
              {chatSessions.map((chat) => (
                <div
                  key={chat.id}
                  onClick={() => selectChat(chat)}
                  className={`p-3 border rounded-lg cursor-pointer hover:bg-gray-50 ${
                    selectedChat?.id === chat.id ? 'bg-blue-50 border-blue-200' : ''
                  }`}
                >
                  <div className="font-medium text-gray-900">{chat.subject}</div>
                  <div className="text-sm text-gray-500">
                    Status: {chat.status} | Priority: {chat.priority}
                  </div>
                  <div className="text-xs text-gray-400">
                    {new Date(chat.created_at).toLocaleString()}
                  </div>
                </div>
              ))}
              {chatSessions.length === 0 && (
                <div className="text-gray-500 text-center py-4">
                  No chat sessions found. Create one to test!
                </div>
              )}
            </div>
          </div>

          {/* Chat Messages */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {selectedChat ? `Chat: ${selectedChat.subject}` : 'Select a chat to view messages'}
            </h2>
            
            {selectedChat && (
              <>
                <div className="h-96 overflow-y-auto border rounded-lg p-4 mb-4 bg-gray-50">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`mb-3 p-3 rounded-lg ${
                        message.sender_type === 'customer'
                          ? 'bg-blue-100 ml-8'
                          : 'bg-green-100 mr-8'
                      }`}
                    >
                      <div className="text-sm font-medium text-gray-700">
                        {message.sender_type === 'customer' ? 'Customer' : 'Agent'}
                      </div>
                      <div className="text-gray-900">{message.message}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {new Date(message.created_at).toLocaleString()}
                      </div>
                    </div>
                  ))}
                  {messages.length === 0 && (
                    <div className="text-gray-500 text-center py-4">
                      No messages yet. Send the first message!
                    </div>
                  )}
                </div>

                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder="Type your message..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    onClick={sendMessage}
                    disabled={loading || !newMessage.trim()}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
                  >
                    Send
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 