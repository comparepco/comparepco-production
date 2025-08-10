'use client';

import { useState, useEffect } from 'react';
import { FaUsers, FaHeadset, FaComments, FaClock, FaCheckCircle, FaExclamationTriangle, FaUserClock, FaStar, FaChartLine, FaCalendarAlt } from 'react-icons/fa';
import { supabase } from '@/lib/supabase/client';
import toast from 'react-hot-toast';

interface StaffMember {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  is_available: boolean;
  current_chats: number;
  max_concurrent_chats: number;
  total_chats_handled: number;
  average_response_time: number;
  customer_satisfaction_rating: number;
  join_date: string;
}

interface ChatSession {
  id: string;
  customer_name: string;
  staff_member_id: string;
  status: 'active' | 'waiting' | 'resolved';
  created_at: string;
  resolved_at?: string;
  rating?: number;
}

interface SupportTicket {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  assigned_to?: string;
  created_at: string;
  updated_at: string;
}

export default function StaffDashboard() {
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
    setupRealtimeSubscriptions();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);

      // Load staff members
      const { data: staffData, error: staffError } = await supabase
        .from('staff_members')
        .select('*')
        .order('created_at', { ascending: false });

      if (staffError) throw staffError;

      // Load chat sessions
      const { data: chatData, error: chatError } = await supabase
        .from('chat_sessions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (chatError) throw chatError;

      // Load support tickets
      const { data: ticketData, error: ticketError } = await supabase
        .from('support_tickets')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (ticketError) throw ticketError;

      setStaffMembers(staffData || []);
      setChatSessions(chatData || []);
      setSupportTickets(ticketData || []);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const setupRealtimeSubscriptions = () => {
    // Subscribe to staff member updates
    const staffSubscription = supabase
      .channel('staff_updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'staff_members'
      }, () => {
        loadDashboardData();
      })
      .subscribe();

    // Subscribe to chat session updates
    const chatSubscription = supabase
      .channel('chat_updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'chat_sessions'
      }, () => {
        loadDashboardData();
      })
      .subscribe();

    // Subscribe to support ticket updates
    const ticketSubscription = supabase
      .channel('ticket_updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'support_tickets'
      }, () => {
        loadDashboardData();
      })
      .subscribe();

    return () => {
      staffSubscription.unsubscribe();
      chatSubscription.unsubscribe();
      ticketSubscription.unsubscribe();
    };
  };

  const createStaffMemberRecord = async (userId: string, userData: any) => {
    try {
      const { error } = await supabase
        .from('staff_members')
        .insert({
          id: userId,
          name: userData.name,
          email: userData.email,
          role: 'support_agent',
          department: userData.department || 'Customer Support',
          is_available: true,
          current_chats: 0,
          max_concurrent_chats: 5,
          total_chats_handled: 0,
          average_response_time: 0,
          customer_satisfaction_rating: 5,
          join_date: new Date().toISOString()
        });

      if (error) throw error;
      toast.success('Staff member record created');
    } catch (error) {
      console.error('Error creating staff member record:', error);
      toast.error('Failed to create staff member record');
    }
  };

  const handleUpdateStaffStatus = async (staffId: string, isAvailable: boolean) => {
    try {
      const { error } = await supabase
        .from('staff_members')
        .update({ is_available: isAvailable })
        .eq('id', staffId);

      if (error) throw error;

      setStaffMembers(prev => 
        prev.map(staff => 
          staff.id === staffId 
            ? { ...staff, is_available: isAvailable }
            : staff
        )
      );

      toast.success(`Staff member ${isAvailable ? 'marked as available' : 'marked as busy'}`);
    } catch (error) {
      console.error('Error updating staff status:', error);
      toast.error('Failed to update staff status');
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'high':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'low':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved':
      case 'closed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'open':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getChatStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'waiting':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'resolved':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  // Calculate stats
  const totalStaff = staffMembers.length;
  const availableStaff = staffMembers.filter(s => s.is_available).length;
  const activeChats = chatSessions.filter(c => c.status === 'active').length;
  const waitingChats = chatSessions.filter(c => c.status === 'waiting').length;
  const openTickets = supportTickets.filter(t => t.status === 'open').length;
  const inProgressTickets = supportTickets.filter(t => t.status === 'in_progress').length;
  const avgResponseTime = staffMembers.length > 0 
    ? staffMembers.reduce((sum, staff) => sum + staff.average_response_time, 0) / staffMembers.length 
    : 0;
  const avgSatisfaction = staffMembers.length > 0 
    ? staffMembers.reduce((sum, staff) => sum + staff.customer_satisfaction_rating, 0) / staffMembers.length 
    : 0;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Staff Dashboard</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Monitor staff performance and support operations</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-gray-200 dark:border-slate-700">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <FaUsers className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-4">
                <h3 className="text-gray-500 dark:text-gray-400 text-sm">Total Staff</h3>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{totalStaff}</div>
                <p className="text-sm text-green-600 dark:text-green-400">
                  {availableStaff} available
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-gray-200 dark:border-slate-700">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <FaComments className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="ml-4">
                <h3 className="text-gray-500 dark:text-gray-400 text-sm">Active Chats</h3>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{activeChats}</div>
                <p className="text-sm text-yellow-600 dark:text-yellow-400">
                  {waitingChats} waiting
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-gray-200 dark:border-slate-700">
            <div className="flex items-center">
              <div className="p-3 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                <FaHeadset className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div className="ml-4">
                <h3 className="text-gray-500 dark:text-gray-400 text-sm">Open Tickets</h3>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{openTickets}</div>
                <p className="text-sm text-blue-600 dark:text-blue-400">
                  {inProgressTickets} in progress
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-gray-200 dark:border-slate-700">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                <FaStar className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="ml-4">
                <h3 className="text-gray-500 dark:text-gray-400 text-sm">Avg Satisfaction</h3>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{avgSatisfaction.toFixed(1)}</div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {avgResponseTime.toFixed(1)}m avg response
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Staff Members */}
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Staff Members</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {staffMembers.map((staff) => (
                  <div key={staff.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-700 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 dark:text-blue-400 font-semibold">
                          {staff.name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-900 dark:text-white">{staff.name}</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{staff.role} • {staff.department}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        staff.is_available 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' 
                          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                      }`}>
                        {staff.is_available ? 'Available' : 'Busy'}
                      </span>
                      <button
                        onClick={() => handleUpdateStaffStatus(staff.id, !staff.is_available)}
                        className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        Toggle
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Chat Sessions */}
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Chat Sessions</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {chatSessions.slice(0, 5).map((chat) => (
                  <div key={chat.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-700 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                        <FaComments className="w-4 h-4 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-900 dark:text-white">{chat.customer_name}</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(chat.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${getChatStatusColor(chat.status)}`}>
                        {chat.status}
                      </span>
                      {chat.rating && (
                        <div className="flex items-center space-x-1">
                          <FaStar className="w-3 h-3 text-yellow-500" />
                          <span className="text-xs text-gray-600 dark:text-gray-400">{chat.rating}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Support Tickets */}
        <div className="mt-8 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Support Tickets</h2>
          </div>
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                <thead className="bg-gray-50 dark:bg-slate-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Ticket</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Priority</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Created</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
                  {supportTickets.slice(0, 10).map((ticket) => (
                    <tr key={ticket.id} className="hover:bg-gray-50 dark:hover:bg-slate-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">{ticket.title}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">{ticket.description.substring(0, 50)}...</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(ticket.priority)}`}>
                          {ticket.priority}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(ticket.status)}`}>
                          {ticket.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {new Date(ticket.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 