'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'react-hot-toast';
import {
  FaComments, FaUser, FaPaperPlane, FaTimes, FaPaperclip, FaSmile,
  FaClock, FaCheckCircle, FaExclamationTriangle, FaSearch, FaFilter,
  FaHeadset, FaCog, FaBell, FaRedo, FaSort, FaSortUp, FaSortDown,
  FaCreditCard, FaCar, FaMoneyBillWave, FaFileAlt, FaQuestionCircle,
  FaArrowLeft, FaArrowRight, FaEllipsisV, FaStar, FaThumbsUp, FaThumbsDown
} from 'react-icons/fa';

interface ChatMessage {
  id: string;
  chat_session_id: string;
  sender_id: string;
  sender_type: 'customer' | 'agent' | 'system';
  message: string;
  message_type: 'text' | 'file' | 'image' | 'system';
  file_url?: string;
  file_name?: string;
  file_size?: number;
  is_read: boolean;
  read_at?: string;
  created_at: string;
  sender?: {
    name: string;
    email: string;
  };
}

interface ChatSession {
  id: string;
  customer_id: string;
  customer_type: 'driver' | 'partner' | 'customer';
  agent_id?: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'waiting' | 'active' | 'completed' | 'closed';
  subject?: string;
  assigned_at?: string;
  started_at?: string;
  completed_at?: string;
  waiting_time_minutes?: number;
  session_duration_minutes?: number;
  message_count: number;
  satisfaction_rating?: number;
  satisfaction_comment?: string;
  tags?: string[];
  created_at: string;
  updated_at: string;
  customer?: {
    name: string;
    email: string;
  };
  agent?: {
    name: string;
    email: string;
  };
}

interface QuickResponse {
  id: string;
  title: string;
  content: string;
  category: string;
  subcategory?: string;
  tags?: string[];
}

export default function AdminLiveChatSupportPage() {
  const { user } = useAuth();
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [selectedChat, setSelectedChat] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [quickResponses, setQuickResponses] = useState<QuickResponse[]>([]);
  const [showQuickResponses, setShowQuickResponses] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadChatSessions();
    loadQuickResponses();
    setupRealtimeSubscriptions();
  }, []);

  useEffect(() => {
    if (selectedChat) {
      loadMessages(selectedChat.id);
    }
  }, [selectedChat]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadChatSessions = async () => {
    try {
      const { data, error } = await supabase
        .from('chat_sessions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setChatSessions(data || []);
    } catch (error) {
      console.error('Error loading chat sessions:', error);
      toast.error('Failed to load chat sessions');
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (chatId: string) => {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('chat_session_id', chatId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error loading messages:', error);
      toast.error('Failed to load messages');
    }
  };

  const loadQuickResponses = async () => {
    try {
      const { data, error } = await supabase
        .from('quick_responses')
        .select('*')
        .eq('is_active', true)
        .order('title');

      if (error) throw error;
      setQuickResponses(data || []);
    } catch (error) {
      console.error('Error loading quick responses:', error);
    }
  };

  const setupRealtimeSubscriptions = () => {
    const chatSubscription = supabase
      .channel('chat_sessions')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'chat_sessions'
      }, () => {
        loadChatSessions();
      })
      .subscribe();

    const messagesSubscription = supabase
      .channel('chat_messages')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'chat_messages'
      }, (payload) => {
        if (selectedChat && payload.new && (payload.new as any).chat_session_id === selectedChat.id) {
          setMessages(prev => [...prev, payload.new as ChatMessage]);
        }
      })
      .subscribe();

    return () => {
      chatSubscription.unsubscribe();
      messagesSubscription.unsubscribe();
    };
  };

  const sendMessage = async () => {
    if (!selectedChat || !newMessage.trim()) return;

    try {
      const { error } = await supabase
        .from('chat_messages')
        .insert({
          chat_session_id: selectedChat.id,
          sender_id: user?.id,
          sender_type: 'agent',
          message_type: 'text',
          message: newMessage.trim(),
          is_read: false
        });

      if (error) throw error;

      // Update session message count
      await supabase
        .from('chat_sessions')
        .update({ 
          message_count: selectedChat.message_count + 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedChat.id);

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    }
  };

  const resolveChat = async () => {
    if (!selectedChat) return;

    try {
      const { error } = await supabase
        .from('chat_sessions')
        .update({ 
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', selectedChat.id);

      if (error) throw error;

      toast.success('Chat resolved successfully');
      loadChatSessions();
      setSelectedChat(null);
    } catch (error) {
      console.error('Error resolving chat:', error);
      toast.error('Failed to resolve chat');
    }
  };

  const endChat = async () => {
    if (!selectedChat) return;

    try {
      const { error } = await supabase
        .from('chat_sessions')
        .update({ 
          status: 'closed',
          completed_at: new Date().toISOString()
        })
        .eq('id', selectedChat.id);

      if (error) throw error;

      toast.success('Chat ended successfully');
      loadChatSessions();
      setSelectedChat(null);
    } catch (error) {
      console.error('Error ending chat:', error);
      toast.error('Failed to end chat');
    }
  };

  const assignChat = async () => {
    if (!selectedChat) return;

    try {
      const { error } = await supabase
        .from('chat_sessions')
        .update({ 
          agent_id: user?.id,
          status: 'active',
          assigned_at: new Date().toISOString(),
          started_at: new Date().toISOString()
        })
        .eq('id', selectedChat.id);

      if (error) throw error;

      toast.success('Chat assigned successfully');
      loadChatSessions();
    } catch (error) {
      console.error('Error assigning chat:', error);
      toast.error('Failed to assign chat');
    }
  };

  const handleQuickResponse = (response: QuickResponse) => {
    setNewMessage(response.content);
    setShowQuickResponses(false);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedChat) return;

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `chat-files/${selectedChat.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('uploads')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('uploads')
        .getPublicUrl(filePath);

      const { error } = await supabase
        .from('chat_messages')
        .insert({
          chat_session_id: selectedChat.id,
          sender_id: user?.id,
          sender_type: 'agent',
          message: `File: ${file.name}`,
          message_type: 'file',
          file_url: publicUrl,
          file_name: file.name,
          file_size: file.size
        });

      if (error) throw error;
      toast.success('File uploaded');
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Failed to upload file');
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'waiting': return 'bg-blue-100 text-blue-800';
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'closed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredChatSessions = chatSessions.filter(chat => {
    const matchesStatus = filterStatus === 'all' || chat.status === filterStatus;
    const matchesSearch = searchTerm === '' || 
      (chat.subject && chat.subject.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (chat.customer?.name && chat.customer.name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesStatus && matchesSearch;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading chat support...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="flex h-screen">
        {/* Chat Sessions Sidebar */}
        <div className="w-1/3 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                Live Chat Support
              </h1>
              <button
                onClick={loadChatSessions}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <FaRedo className="w-4 h-4" />
              </button>
            </div>
            
            {/* Filters */}
            <div className="space-y-2">
              <input
                type="text"
                placeholder="Search chats..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="all">All Status</option>
                <option value="waiting">Waiting</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="closed">Closed</option>
              </select>
            </div>
          </div>

          {/* Chat Sessions List */}
          <div className="overflow-y-auto h-full">
            {filteredChatSessions.length === 0 ? (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                No chat sessions found
              </div>
            ) : (
              filteredChatSessions.map((chat) => (
                <div
                  key={chat.id}
                  className={`p-4 border-b border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                    selectedChat?.id === chat.id ? 'bg-blue-50 dark:bg-blue-900' : ''
                  }`}
                  onClick={() => setSelectedChat(chat)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        {chat.subject || 'Chat Session'}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {chat.customer?.name || 'Unknown customer'}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(chat.priority)}`}>
                          {chat.priority}
                        </span>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(chat.status)}`}>
                          {chat.status}
                        </span>
                      </div>
                    </div>
                    <div className="text-right text-xs text-gray-500 dark:text-gray-400">
                      <div>{new Date(chat.created_at).toLocaleDateString()}</div>
                      <div>{chat.message_count} messages</div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Chat Interface */}
        <div className="flex-1 flex flex-col">
          {selectedChat ? (
            <>
              {/* Chat Header */}
              <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {selectedChat.subject || 'Chat Session'}
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {selectedChat.customer?.name} ({selectedChat.customer_type})
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(selectedChat.priority)}`}>
                      {selectedChat.priority}
                    </span>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedChat.status)}`}>
                      {selectedChat.status}
                    </span>
                    {selectedChat.status === 'waiting' && (
                      <button
                        onClick={assignChat}
                        className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                      >
                        Assign to Me
                      </button>
                    )}
                    {selectedChat.status === 'active' && (
                      <div className="flex space-x-2">
                        <button
                          onClick={resolveChat}
                          className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
                        >
                          Resolve
                        </button>
                        <button
                          onClick={endChat}
                          className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors"
                        >
                          End Chat
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender_type === 'agent' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.sender_type === 'agent'
                          ? 'bg-blue-600 text-white'
                          : message.sender_type === 'system'
                          ? 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                      }`}
                    >
                      {message.message_type === 'file' ? (
                        <div>
                          <div className="font-medium">{message.message}</div>
                          <a
                            href={message.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:text-blue-300 underline"
                          >
                            Download {message.file_name}
                          </a>
                        </div>
                      ) : (
                        <div>{message.message}</div>
                      )}
                      <div className="text-xs opacity-75 mt-1">
                        {new Date(message.created_at).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowQuickResponses(!showQuickResponses)}
                    className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    title="Quick Responses"
                  >
                    <FaSmile className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    title="Attach File"
                  >
                    <FaPaperclip className="w-4 h-4" />
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <div className="flex-1 relative">
                    {showQuickResponses && (
                      <div className="absolute bottom-full left-0 mb-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                        {quickResponses.map((response) => (
                          <button
                            key={response.id}
                            onClick={() => handleQuickResponse(response)}
                            className="block w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm"
                          >
                            <div className="font-medium">{response.title}</div>
                            <div className="text-gray-600 dark:text-gray-400 text-xs">
                              {response.content.substring(0, 50)}...
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                      placeholder="Type your message..."
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <button
                    onClick={sendMessage}
                    disabled={!newMessage.trim()}
                    className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FaPaperPlane className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <FaComments className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Select a Chat Session
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Choose a chat session from the sidebar to start supporting customers
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 