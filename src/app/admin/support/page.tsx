'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'react-hot-toast';
import {
  FaTicketAlt, FaComments, FaUsers, FaClock, FaCheckCircle, FaExclamationTriangle,
  FaArrowUp, FaArrowDown, FaEye, FaEdit, FaTrash, FaPlus, FaSearch, FaFilter,
  FaUser, FaEnvelope, FaPhone, FaCalendar, FaTag, FaStar, FaChartLine,
  FaHeadset, FaShieldAlt, FaCog, FaBell, FaRedo, FaSort, FaSortUp, FaSortDown,
  FaCreditCard, FaCar, FaMoneyBillWave, FaFileAlt, FaQuestionCircle, FaTimes
} from 'react-icons/fa';

interface SupportTicket {
  id: string;
  user_id: string;
  user_type: 'driver' | 'partner' | 'customer' | 'admin';
  subject: string;
  description: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  assigned_to?: string;
  assigned_at?: string;
  resolved_at?: string;
  response_time_minutes?: number;
  satisfaction_rating?: number;
  satisfaction_comment?: string;
  tags?: string[];
  internal_notes?: string;
  created_at: string;
  updated_at: string;
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
}

interface SupportStaff {
  id: string;
  user_id: string;
  name: string;
  email: string;
  role: 'support_agent' | 'supervisor' | 'manager' | 'admin';
  department: string;
  specializations?: string[];
  is_available: boolean;
  is_online: boolean;
  current_chats: number;
  max_concurrent_chats: number;
  total_chats_handled: number;
  total_tickets_handled: number;
  average_response_time_minutes: number;
  average_satisfaction_rating: number;
  working_hours: any;
  join_date: string;
}

interface DashboardStats {
  totalTickets: number;
  openTickets: number;
  urgentTickets: number;
  averageResponseTime: number;
  averageSatisfaction: number;
  activeChats: number;
  waitingChats: number;
  onlineStaff: number;
  totalStaff: number;
}

export default function AdminSupportDashboard() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [staffMembers, setStaffMembers] = useState<SupportStaff[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalTickets: 0,
    openTickets: 0,
    urgentTickets: 0,
    averageResponseTime: 0,
    averageSatisfaction: 0,
    activeChats: 0,
    waitingChats: 0,
    onlineStaff: 0,
    totalStaff: 0
  });
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [selectedChat, setSelectedChat] = useState<ChatSession | null>(null);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadDashboardData();
    setupRealtimeSubscriptions();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Load tickets
      const { data: ticketsData, error: ticketsError } = await supabase
        .from('support_tickets')
        .select('*')
        .order('created_at', { ascending: false });

      if (ticketsError) {
        console.error('Tickets error:', ticketsError);
        toast.error(`Failed to load tickets: ${ticketsError.message}`);
        return;
      }

      // Load chat sessions
      const { data: chatsData, error: chatsError } = await supabase
        .from('chat_sessions')
        .select('*')
        .order('created_at', { ascending: false });

      if (chatsError) {
        console.error('Chats error:', chatsError);
        toast.error(`Failed to load chats: ${chatsError.message}`);
        return;
      }

      // Load staff members
      const { data: staffData, error: staffError } = await supabase
        .from('support_staff')
        .select('*')
        .order('name');

      if (staffError) {
        console.error('Staff error:', staffError);
        toast.error(`Failed to load staff: ${staffError.message}`);
        return;
      }

      setTickets(ticketsData || []);
      setChatSessions(chatsData || []);
      setStaffMembers(staffData || []);

      // Calculate stats
      calculateStats(ticketsData || [], chatsData || [], staffData || []);

      console.log('Dashboard data loaded successfully:', {
        tickets: ticketsData?.length || 0,
        chats: chatsData?.length || 0,
        staff: staffData?.length || 0
      });

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (tickets: SupportTicket[], chats: ChatSession[], staff: SupportStaff[]) => {
    const totalTickets = tickets.length;
    const openTickets = tickets.filter(t => t.status === 'open' || t.status === 'in_progress').length;
    const urgentTickets = tickets.filter(t => t.priority === 'urgent').length;
    const activeChats = chats.filter(c => c.status === 'active').length;
    const waitingChats = chats.filter(c => c.status === 'waiting').length;
    const onlineStaff = staff.filter(s => s.is_online).length;
    const totalStaff = staff.length;

    // Calculate average response time
    const responseTimes = tickets
      .filter(t => t.response_time_minutes)
      .map(t => t.response_time_minutes!);
    const averageResponseTime = responseTimes.length > 0 
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length 
      : 0;

    // Calculate average satisfaction
    const ratings = tickets
      .filter(t => t.satisfaction_rating)
      .map(t => t.satisfaction_rating!);
    const averageSatisfaction = ratings.length > 0 
      ? ratings.reduce((a, b) => a + b, 0) / ratings.length 
      : 0;

    setStats({
      totalTickets,
      openTickets,
      urgentTickets,
      averageResponseTime: Math.round(averageResponseTime),
      averageSatisfaction: Math.round(averageSatisfaction * 10) / 10,
      activeChats,
      waitingChats,
      onlineStaff,
      totalStaff
    });
  };

  const setupRealtimeSubscriptions = () => {
    const ticketsSubscription = supabase
      .channel('support_tickets')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'support_tickets'
      }, () => {
        loadDashboardData();
      })
      .subscribe();

    const chatsSubscription = supabase
      .channel('chat_sessions')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'chat_sessions'
      }, () => {
        loadDashboardData();
      })
      .subscribe();

    const staffSubscription = supabase
      .channel('support_staff')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'support_staff'
      }, () => {
        loadDashboardData();
      })
      .subscribe();

    return () => {
      ticketsSubscription.unsubscribe();
      chatsSubscription.unsubscribe();
      staffSubscription.unsubscribe();
    };
  };

  const handleAssignTicket = async (ticketId: string, agentId: string) => {
    try {
      const { error } = await supabase
        .from('support_tickets')
        .update({
          assigned_to: agentId,
          assigned_at: new Date().toISOString(),
          status: 'in_progress'
        })
        .eq('id', ticketId);

      if (error) throw error;
      toast.success('Ticket assigned successfully');
      loadDashboardData();
    } catch (error) {
      console.error('Error assigning ticket:', error);
      toast.error('Failed to assign ticket');
    }
  };

  const handleUpdateTicketStatus = async (ticketId: string, status: string) => {
    try {
      const updateData: any = { status };
      if (status === 'resolved') {
        updateData.resolved_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('support_tickets')
        .update(updateData)
        .eq('id', ticketId);

      if (error) throw error;
      toast.success('Ticket status updated');
      loadDashboardData();
    } catch (error) {
      console.error('Error updating ticket status:', error);
      toast.error('Failed to update ticket status');
    }
  };

  const handleAssignChat = async (chatId: string, agentId: string) => {
    try {
      const { error } = await supabase
        .from('chat_sessions')
        .update({
          agent_id: agentId,
          assigned_at: new Date().toISOString(),
          status: 'active',
          started_at: new Date().toISOString()
        })
        .eq('id', chatId);

      if (error) throw error;
      toast.success('Chat assigned successfully');
      loadDashboardData();
    } catch (error) {
      console.error('Error assigning chat:', error);
      toast.error('Failed to assign chat');
    }
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
      case 'open': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'technical': return <FaCog className="w-4 h-4" />;
      case 'billing': return <FaCreditCard className="w-4 h-4" />;
      case 'account': return <FaUser className="w-4 h-4" />;
      case 'vehicle': return <FaCar className="w-4 h-4" />;
      case 'booking': return <FaCalendar className="w-4 h-4" />;
      case 'payment': return <FaMoneyBillWave className="w-4 h-4" />;
      case 'documentation': return <FaFileAlt className="w-4 h-4" />;
      default: return <FaQuestionCircle className="w-4 h-4" />;
    }
  };

  const filteredTickets = tickets.filter(ticket => {
    const matchesStatus = filterStatus === 'all' || ticket.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || ticket.priority === filterPriority;
    const matchesSearch = searchTerm === '' || 
      ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesStatus && matchesPriority && matchesSearch;
  });

  const availableStaff = staffMembers.filter(staff => 
    staff.is_available && staff.current_chats < staff.max_concurrent_chats
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading support dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Customer Support Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage support tickets, live chats, and staff performance
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <FaTicketAlt className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Tickets</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalTickets}</p>
              </div>
            </div>
            <div className="mt-4">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {stats.openTickets} open, {stats.urgentTickets} urgent
              </span>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <FaComments className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Live Chats</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.activeChats}</p>
              </div>
            </div>
            <div className="mt-4">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {stats.waitingChats} waiting
              </span>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <FaClock className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg Response</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.averageResponseTime}m</p>
              </div>
            </div>
            <div className="mt-4">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {stats.averageSatisfaction}/5 satisfaction
              </span>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                <FaUsers className="w-6 h-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Online Staff</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.onlineStaff}</p>
              </div>
            </div>
            <div className="mt-4">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                of {stats.totalStaff} total
              </span>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search tickets..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
            <div className="flex gap-4">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="all">All Status</option>
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="all">All Priority</option>
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
              <button
                onClick={loadDashboardData}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <FaRedo className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Tickets and Chats Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Support Tickets */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
                <FaTicketAlt className="w-5 h-5 mr-2" />
                Support Tickets ({filteredTickets.length})
              </h2>
            </div>
            <div className="p-6">
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {filteredTickets.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                    No tickets found
                  </p>
                ) : (
                  filteredTickets.map((ticket) => (
                    <div
                      key={ticket.id}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                      onClick={() => {
                        setSelectedTicket(ticket);
                        setShowTicketModal(true);
                      }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {getCategoryIcon(ticket.category)}
                            <h3 className="font-medium text-gray-900 dark:text-white">
                              {ticket.subject}
                            </h3>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            {ticket.description.substring(0, 100)}...
                          </p>
                          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                            <span>By: User ID: {ticket.user_id}</span>
                            <span>•</span>
                            <span>{new Date(ticket.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(ticket.priority)}`}>
                            {ticket.priority}
                          </span>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(ticket.status)}`}>
                            {ticket.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Live Chats */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
                <FaComments className="w-5 h-5 mr-2" />
                Live Chats ({chatSessions.filter(c => c.status === 'active' || c.status === 'waiting').length})
              </h2>
            </div>
            <div className="p-6">
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {chatSessions.filter(c => c.status === 'active' || c.status === 'waiting').length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                    No active chats
                  </p>
                ) : (
                  chatSessions
                    .filter(c => c.status === 'active' || c.status === 'waiting')
                    .map((chat) => (
                      <div
                        key={chat.id}
                        className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                        onClick={() => {
                          setSelectedChat(chat);
                          setShowChatModal(true);
                        }}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <FaComments className="w-4 h-4 text-blue-600" />
                              <h3 className="font-medium text-gray-900 dark:text-white">
                                {chat.subject || 'Chat Session'}
                              </h3>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                              Customer ID: {chat.customer_id} • {chat.message_count} messages
                            </p>
                            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                              <span>Type: {chat.customer_type}</span>
                              <span>•</span>
                              <span>{new Date(chat.created_at).toLocaleDateString()}</span>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(chat.priority)}`}>
                              {chat.priority}
                            </span>
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(chat.status)}`}>
                              {chat.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Staff Performance */}
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
              <FaUsers className="w-5 h-5 mr-2" />
              Staff Performance
            </h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {staffMembers.map((staff) => (
                <div key={staff.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">{staff.name}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{staff.role}</p>
                    </div>
                    <div className={`w-3 h-3 rounded-full ${staff.is_online ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Current Chats:</span>
                      <span className="font-medium">{staff.current_chats}/{staff.max_concurrent_chats}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Total Handled:</span>
                      <span className="font-medium">{staff.total_tickets_handled + staff.total_chats_handled}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Avg Response:</span>
                      <span className="font-medium">{staff.average_response_time_minutes}m</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Satisfaction:</span>
                      <span className="font-medium">{staff.average_satisfaction_rating}/5</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Ticket Modal */}
      {showTicketModal && selectedTicket && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Ticket Details
                </h2>
                <button
                  onClick={() => setShowTicketModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <FaTimes className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white mb-2">Subject</h3>
                  <p className="text-gray-600 dark:text-gray-400">{selectedTicket.subject}</p>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white mb-2">Description</h3>
                  <p className="text-gray-600 dark:text-gray-400">{selectedTicket.description}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white mb-2">Customer</h3>
                    <p className="text-gray-600 dark:text-gray-400">User ID: {selectedTicket.user_id}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Type: {selectedTicket.user_type}</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white mb-2">Assigned To</h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      {selectedTicket.assigned_to || 'Unassigned'}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white mb-2">Priority</h3>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(selectedTicket.priority)}`}>
                      {selectedTicket.priority}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white mb-2">Status</h3>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedTicket.status)}`}>
                      {selectedTicket.status}
                    </span>
                  </div>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white mb-2">Actions</h3>
                  <div className="flex gap-2">
                    {selectedTicket.status !== 'resolved' && selectedTicket.status !== 'closed' && (
                      <button
                        onClick={() => handleUpdateTicketStatus(selectedTicket.id, 'resolved')}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        Mark Resolved
                      </button>
                    )}
                    {!selectedTicket.assigned_to && availableStaff.length > 0 && (
                      <select
                        onChange={(e) => handleAssignTicket(selectedTicket.id, e.target.value)}
                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      >
                        <option value="">Assign to...</option>
                        {availableStaff.map((staff) => (
                          <option key={staff.id} value={staff.user_id}>
                            {staff.name} ({staff.role})
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Chat Modal */}
      {showChatModal && selectedChat && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Chat Session
                </h2>
                <button
                  onClick={() => setShowChatModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <FaTimes className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white mb-2">Subject</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {selectedChat.subject || 'Chat Session'}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white mb-2">Customer</h3>
                    <p className="text-gray-600 dark:text-gray-400">Customer ID: {selectedChat.customer_id}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Type: {selectedChat.customer_type}</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white mb-2">Assigned To</h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      {selectedChat.agent_id || 'Unassigned'}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white mb-2">Priority</h3>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(selectedChat.priority)}`}>
                      {selectedChat.priority}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white mb-2">Status</h3>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedChat.status)}`}>
                      {selectedChat.status}
                    </span>
                  </div>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white mb-2">Actions</h3>
                  <div className="flex gap-2">
                    {selectedChat.status === 'waiting' && availableStaff.length > 0 && (
                      <select
                        onChange={(e) => handleAssignChat(selectedChat.id, e.target.value)}
                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      >
                        <option value="">Assign to...</option>
                        {availableStaff.map((staff) => (
                          <option key={staff.id} value={staff.user_id}>
                            {staff.name} ({staff.role})
                          </option>
                        ))}
                      </select>
                    )}
                    <button
                      onClick={() => window.open(`/admin/support/chat/${selectedChat.id}`, '_blank')}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Join Chat
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 