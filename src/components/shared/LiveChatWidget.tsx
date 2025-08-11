'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'react-hot-toast';
import { 
  FaComments, FaTimes, FaPaperPlane, FaUser, FaCar, FaExclamationTriangle,
  FaWrench, FaMoneyBillWave, FaFileAlt, FaClock, FaCheckCircle, FaPhone, FaEnvelope,
  FaStar, FaThumbsUp, FaThumbsDown, FaMobile, FaCreditCard, FaShieldAlt, FaUsers,
  FaCalendarAlt, FaMapMarkerAlt, FaBolt, FaTools, FaQuestionCircle, FaExclamationCircle,
  FaHeadset, FaUserTie, FaBullhorn, FaChartLine
} from 'react-icons/fa';

interface ChatMessage {
  id: string;
  chat_session_id: string;
  sender_id: string;
  sender_type: string;
  message_type: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

interface ChatSession {
  id: string;
  customer_id: string;
  customer_type: string;
  agent_id?: string;
  category: string;
  priority: string;
  status: string;
  subject?: string;
  assigned_at?: string;
  started_at?: string;
  completed_at?: string;
  message_count: number;
  created_at: string;
  updated_at: string;
}

interface Agent {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
}

interface QuickIssue {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  icon: React.ComponentType<any>;
}

interface LiveChatWidgetProps {
  bookingId?: string;
  vehicleId?: string;
  className?: string;
}

export default function LiveChatWidget({ bookingId, vehicleId, className = '' }: LiveChatWidgetProps) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [showQuickIssues, setShowQuickIssues] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [agentStatus] = useState<'online' | 'offline' | 'busy'>('online');
  const [currentAgent, setCurrentAgent] = useState<Agent | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Review state
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSessionId, setReviewSessionId] = useState<string | null>(null);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  // Load existing chat sessions
  useEffect(() => {
    if (!user || !isOpen) return;

    const loadChatSessions = async () => {
      try {
        const { data: sessions, error } = await supabase
          .from('chat_sessions')
          .select('*')
          .eq('customer_id', user.id)
          .in('status', ['waiting', 'active'])
          .order('created_at', { ascending: false })
          .limit(1);

        if (error) {
          console.error('Error loading chat sessions:', error);
          toast.error('Failed to load chat sessions');
          return;
        }

        if (sessions && sessions.length > 0) {
          const session = sessions[0];
          setCurrentSession(session);
          setShowQuickIssues(false);
          
          // Load agent information if assigned
          if (session.agent_id) {
            await loadAgentInfo(session.agent_id);
          }
        } else {
          setCurrentSession(null);
          setShowQuickIssues(true);
        }
      } catch (error) {
        console.error('Error in loadChatSessions:', error);
        toast.error('Failed to load chat sessions');
      }
    };

    loadChatSessions();

    // Set up real-time subscription for chat sessions
    const subscription = supabase
      .channel('chat_sessions')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'chat_sessions',
        filter: `customer_id=eq.${user.id}`
      }, async (payload) => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          await loadChatSessions();
        }
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user, isOpen]);

  // Load agent information
  const loadAgentInfo = async (agentId: string) => {
    try {
      const { data: agent, error } = await supabase
        .from('support_staff')
        .select('*')
        .eq('user_id', agentId)
        .single();

      if (error) {
        console.error('Error loading agent info:', error);
        return;
      }

      if (agent) {
        setCurrentAgent({
          id: agent.user_id,
          name: agent.name,
          email: agent.email,
          role: agent.role,
          department: agent.department
        });
      }
    } catch (error) {
      console.error('Error in loadAgentInfo:', error);
    }
  };

  // Load messages for current session
  useEffect(() => {
    if (!currentSession) {
      setMessages([]);
      return;
    }

    const loadMessages = async () => {
      try {
        const { data: messagesData, error } = await supabase
          .from('chat_messages')
          .select('*')
          .eq('chat_session_id', currentSession.id)
          .order('created_at', { ascending: true });

        if (error) {
          console.error('Error loading messages:', error);
          toast.error('Failed to load messages');
          return;
        }

        setMessages(messagesData || []);
      } catch (error) {
        console.error('Error in loadMessages:', error);
        toast.error('Failed to load messages');
      }
    };

    loadMessages();

    // Set up real-time subscription for messages
    const subscription = supabase
      .channel('chat_messages')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'chat_messages',
        filter: `chat_session_id=eq.${currentSession.id}`
      }, async (payload) => {
        if (payload.eventType === 'INSERT') {
          await loadMessages();
          
          // If agent joins, load their info
          if (payload.new && payload.new.sender_type === 'agent' && !currentAgent) {
            await loadAgentInfo(payload.new.sender_id);
          }
        }
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [currentSession, currentAgent]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Listen for custom events to open chat with context
  useEffect(() => {
    const handleOpenSupportChat = (event: CustomEvent) => {
      const { bookingId: eventBookingId, vehicleId: eventVehicleId } = event.detail;
      setIsOpen(true);
    };

    window.addEventListener('openSupportChat', handleOpenSupportChat as EventListener);
    return () => {
      window.removeEventListener('openSupportChat', handleOpenSupportChat as EventListener);
    };
  }, [bookingId]);

  const startChatSession = async (issue: QuickIssue) => {
    if (!user) return;

    setIsLoading(true);
    try {
      // Create chat session
      const { data: session, error: sessionError } = await supabase
        .from('chat_sessions')
        .insert({
          customer_id: user.id,
          customer_type: user.role || 'customer',
          category: issue.category,
          priority: issue.priority,
          status: 'waiting',
          subject: `${issue.title}: ${issue.description}`,
          message_count: 0
        })
        .select()
        .single();

      if (sessionError) {
        console.error('Error creating chat session:', sessionError);
        toast.error('Failed to start chat session');
        return;
      }

      setCurrentSession(session);
      setShowQuickIssues(false);

      // Add initial message
      const { error: messageError } = await supabase
        .from('chat_messages')
        .insert({
          chat_session_id: session.id,
          sender_id: user.id,
          sender_type: user.role || 'customer',
          message_type: 'text',
          message: `${issue.title}: ${issue.description}`,
          is_read: false
        });

      if (messageError) {
        console.error('Error adding initial message:', messageError);
        toast.error('Failed to send initial message');
      }

      // Add system message
      await supabase
        .from('chat_messages')
        .insert({
          chat_session_id: session.id,
          sender_id: '00000000-0000-0000-0000-000000000000', // System user ID
          sender_type: 'system',
          message_type: 'text',
          message: 'Your support request has been submitted. An agent will join shortly to assist you.',
          is_read: false
        });

      toast.success('Chat session started! An agent will respond shortly.');
    } catch (error) {
      console.error('Error starting chat session:', error);
      toast.error('Failed to start chat session');
    }
    setIsLoading(false);
  };

  const sendMessage = async () => {
    if (!currentSession || !newMessage.trim() || !user) return;

    try {
      const { error } = await supabase
        .from('chat_messages')
        .insert({
          chat_session_id: currentSession.id,
          sender_id: user.id,
          sender_type: user.role || 'customer',
          message_type: 'text',
          message: newMessage.trim(),
          is_read: false
        });

      if (error) {
        console.error('Error sending message:', error);
        toast.error('Failed to send message');
        return;
      }

      // Update session message count
      await supabase
        .from('chat_sessions')
        .update({ 
          message_count: currentSession.message_count + 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', currentSession.id);

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    }
  };

  const endChat = async () => {
    if (!currentSession) return;

    try {
      await supabase
        .from('chat_sessions')
        .update({ 
          status: 'closed',
          completed_at: new Date().toISOString()
        })
        .eq('id', currentSession.id);
      
      setReviewSessionId(currentSession.id);
      setShowReviewModal(true);
      setCurrentSession(null);
      setCurrentAgent(null);
      setShowQuickIssues(true);
    } catch (error) {
      console.error('Error ending chat:', error);
      toast.error('Failed to end chat');
    }
  };

  // Enhanced quick issues based on user role and context
  const quickIssues: QuickIssue[] = [
    // Default issues for all users
    {
      id: 'general-support',
      title: 'General Support',
      description: 'Need help with any general questions or issues',
      category: 'general',
      priority: 'medium',
      icon: FaQuestionCircle
    },
    {
      id: 'technical-issues',
      title: 'Technical Problems',
      description: 'Website issues, login problems, or technical difficulties',
      category: 'technical',
      priority: 'high',
      icon: FaWrench
    },
    {
      id: 'account-help',
      title: 'Account Help',
      description: 'Account creation, login issues, or profile problems',
      category: 'account',
      priority: 'medium',
      icon: FaUser
    },
    {
      id: 'payment-support',
      title: 'Payment Support',
      description: 'Payment issues, billing questions, or refund requests',
      category: 'payment',
      priority: 'high',
      icon: FaCreditCard
    },
    {
      id: 'booking-assistance',
      title: 'Booking Help',
      description: 'Help with booking process, changes, or cancellations',
      category: 'booking',
      priority: 'medium',
      icon: FaCalendarAlt
    },
    
    // Driver-specific issues
    ...(user?.role === 'driver' ? [
      {
        id: 'driver-app-issues',
        title: 'App Not Working',
        description: 'App crashes, login problems, or technical issues',
        category: 'app',
        priority: 'high',
        icon: FaMobile
      },
      {
        id: 'driver-vehicle-breakdown',
        title: 'Vehicle Breakdown',
        description: 'Car broke down, engine problems, or urgent vehicle issues',
        category: 'vehicle',
        priority: 'urgent',
        icon: FaExclamationTriangle
      },
      {
        id: 'driver-payment-issues',
        title: 'Payment Problems',
        description: 'Payment not received, billing errors, or refund issues',
        category: 'payment',
        priority: 'high',
        icon: FaCreditCard
      },
      {
        id: 'driver-booking-help',
        title: 'Booking Assistance',
        description: 'Need help with booking process, changes, or cancellations',
        category: 'booking',
        priority: 'medium',
        icon: FaCalendarAlt
      },
      {
        id: 'driver-document-upload',
        title: 'Document Upload',
        description: 'Help uploading PCO licence, insurance, or other documents',
        category: 'account',
        priority: 'medium',
        icon: FaFileAlt
      },
      {
        id: 'driver-earnings-issues',
        title: 'Earnings Questions',
        description: 'Questions about earnings, statements, or payouts',
        category: 'earnings',
        priority: 'medium',
        icon: FaMoneyBillWave
      },
      {
        id: 'driver-trip-issues',
        title: 'Trip Problems',
        description: 'Issues with trips, navigation, or trip completion',
        category: 'trips',
        priority: 'medium',
        icon: FaMapMarkerAlt
      }
    ] : []),
    
    // Partner-specific issues
    ...(user?.role === 'PARTNER' ? [
      {
        id: 'partner-driver-disputes',
        title: 'Driver Disputes',
        description: 'Issues with drivers, complaints, or driver management',
        category: 'driver',
        priority: 'high',
        icon: FaUsers
      },
      {
        id: 'partner-booking-disputes',
        title: 'Booking Disputes',
        description: 'Problems with bookings, cancellations, or disputes',
        category: 'booking',
        priority: 'high',
        icon: FaCalendarAlt
      },
      {
        id: 'partner-vehicle-management',
        title: 'Vehicle Management',
        description: 'Issues with vehicle listings, updates, or management',
        category: 'vehicle',
        priority: 'high',
        icon: FaCar
      },
      {
        id: 'partner-payment-issues',
        title: 'Payment Problems',
        description: 'Issues with partner payouts, payments, or billing',
        category: 'payment',
        priority: 'high',
        icon: FaMoneyBillWave
      },
      {
        id: 'partner-fleet-issues',
        title: 'Fleet Management',
        description: 'Problems with fleet operations, maintenance, or logistics',
        category: 'fleet',
        priority: 'medium',
        icon: FaTools
      },
      {
        id: 'partner-account-issues',
        title: 'Account Management',
        description: 'Login issues, account settings, or profile problems',
        category: 'account',
        priority: 'medium',
        icon: FaUser
      },
      {
        id: 'partner-insurance-claims',
        title: 'Insurance Claims',
        description: 'Vehicle damage, accident reports, or insurance issues',
        category: 'claims',
        priority: 'high',
        icon: FaShieldAlt
      },
      {
        id: 'partner-maintenance-issues',
        title: 'Maintenance Problems',
        description: 'Vehicle maintenance, repairs, or service issues',
        category: 'maintenance',
        priority: 'medium',
        icon: FaWrench
      }
    ] : [])
  ];

  // Filter issues based on context
  const filteredQuickIssues = quickIssues.filter(issue => {
    if (bookingId && (issue.category === 'booking' || issue.category === 'vehicle')) {
      return true;
    }
    if (vehicleId && issue.category === 'vehicle') {
      return true;
    }
    return true;
  });

  const getMessageSenderName = (message: ChatMessage) => {
    if (message.sender_type === 'system') {
      return 'System';
    }
    if (message.sender_type === 'agent' && currentAgent) {
      return currentAgent.name;
    }
    if (message.sender_type === (user?.role || 'customer')) {
      return user?.email || 'You';
    }
    return 'Support Agent';
  };

  return (
    <div className={`fixed bottom-4 right-4 z-50 ${className}`}>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-3 sm:p-4 shadow-lg transition-all duration-200 flex items-center space-x-2"
        >
          <FaComments className="w-5 h-5 sm:w-6 sm:h-6" />
          <span className="hidden sm:inline">Need Help?</span>
          {agentStatus === 'online' && (
            <div className="absolute -top-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 bg-green-500 rounded-full border-2 border-white"></div>
          )}
        </button>
      )}

      {isOpen && (
        <div className="bg-white rounded-lg shadow-2xl border border-gray-200 w-[calc(100vw-2rem)] sm:w-96 h-[calc(100vh-8rem)] sm:h-[600px] flex flex-col max-w-sm sm:max-w-none">
          <div className="bg-blue-600 text-white p-4 rounded-t-lg flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <FaComments className="w-5 h-5" />
              <div>
                <h3 className="font-semibold">Support Chat</h3>
                <p className="text-xs text-blue-100">
                  {currentAgent ? `Chatting with ${currentAgent.name}` : 
                   agentStatus === 'online' ? 'Agents available' : 'We\'ll respond soon'}
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white hover:text-gray-200"
            >
              <FaTimes className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 flex flex-col min-h-0">
            {!currentSession && showQuickIssues ? (
              <div className="p-4 space-y-4 overflow-y-auto">
                <div className="text-center">
                  <h4 className="font-semibold text-gray-900 mb-2">How can we help you?</h4>
                  <p className="text-sm text-gray-600">Select an issue to start chatting with our support team</p>
                </div>

                <div className="space-y-2">
                  {filteredQuickIssues.map((issue) => {
                    const Icon = issue.icon;
                    return (
                      <button
                        key={issue.id}
                        onClick={() => startChatSession(issue)}
                        disabled={isLoading}
                        className="w-full p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-blue-300 transition-colors disabled:opacity-50"
                      >
                        <div className="flex items-start space-x-3">
                          <Icon className={`w-5 h-5 mt-0.5 ${
                            issue.priority === 'urgent' ? 'text-red-500' :
                            issue.priority === 'high' ? 'text-orange-500' :
                            issue.priority === 'medium' ? 'text-yellow-500' :
                            'text-green-500'
                          }`} />
                          <div>
                            <p className="font-medium text-gray-900">{issue.title}</p>
                            <p className="text-sm text-gray-600">{issue.description}</p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="pt-4 border-t">
                  <div className="text-center text-sm text-gray-500">
                    <p>Emergency? Call us at +44 808 123 4567</p>
                    <p className="mt-1">Available 24/7 for urgent issues</p>
                  </div>
                </div>
              </div>
            ) : currentSession ? (
              <>
                <div className="p-4 border-b bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-gray-900">
                        {currentSession.status === 'waiting' ? 'Connecting to agent...' : 
                         currentAgent ? `Chat with ${currentAgent.name}` : 'Chat with Support'}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {currentSession.status === 'waiting' ? 'Please wait while we connect you' : 
                         currentAgent ? `${currentAgent.department} Department` : 'Agent is online'}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${
                        currentSession.status === 'active' ? 'bg-green-500' : 'bg-yellow-500'
                      }`}></div>
                      <span className="text-xs text-gray-500">
                        {currentSession.status === 'active' ? 'Active' : 'Waiting'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.sender_type === (user?.role || 'customer') ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs px-4 py-2 rounded-lg ${
                          message.sender_type === (user?.role || 'customer')
                            ? 'bg-blue-600 text-white'
                            : message.sender_type === 'system'
                            ? 'bg-gray-100 text-gray-600'
                            : 'bg-gray-200 text-gray-900'
                        }`}
                      >
                        {message.sender_type !== (user?.role || 'customer') && (
                          <p className="text-xs font-medium mb-1 opacity-70">
                            {getMessageSenderName(message)}
                          </p>
                        )}
                        <p className="text-sm">{message.message}</p>
                        <p className="text-xs opacity-70 mt-1">
                          {new Date(message.created_at).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                <div className="p-4 border-t">
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      className="flex-1 border-none outline-none bg-transparent px-2 text-sm text-black placeholder:text-gray-700"
                      placeholder="Type your message..."
                      value={newMessage}
                      onChange={e => setNewMessage(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') sendMessage();
                      }}
                      disabled={isLoading || !currentSession || currentSession.status === 'closed'}
                    />
                    <button
                      onClick={sendMessage}
                      disabled={!newMessage.trim()}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <FaPaperPlane className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <p className="text-xs text-gray-500">
                      {currentSession.status === 'waiting' ? 'Your message will be seen when an agent connects' : 
                       currentAgent ? `${currentAgent.name} will respond shortly` : 'Agent will respond shortly'}
                    </p>
                    <button
                      onClick={endChat}
                      className="text-xs text-red-600 hover:text-red-700"
                    >
                      End Chat
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <FaComments className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Loading chat...</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold mb-4">Rate your support experience</h3>
            <div className="flex justify-center space-x-2 mb-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setReviewRating(star)}
                  className={`text-2xl ${star <= reviewRating ? 'text-yellow-400' : 'text-gray-300'}`}
                >
                  ★
                </button>
              ))}
            </div>
            <textarea
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              placeholder="Tell us about your experience (optional)"
              className="w-full p-2 border rounded-lg mb-4"
              rows={3}
            />
            <div className="flex space-x-2">
              <button
                onClick={async () => {
                  setSubmittingReview(true);
                  try {
                    // Submit review to database
                    await supabase
                      .from('chat_sessions')
                      .update({
                        satisfaction_rating: reviewRating,
                        satisfaction_comment: reviewComment
                      })
                      .eq('id', reviewSessionId);

                    setReviewSubmitted(true);
                    setTimeout(() => {
                      setShowReviewModal(false);
                      setReviewRating(0);
                      setReviewComment('');
                      setReviewSessionId(null);
                      setReviewSubmitted(false);
                    }, 2000);
                  } catch (error) {
                    console.error('Error submitting review:', error);
                  } finally {
                    setSubmittingReview(false);
                  }
                }}
                disabled={submittingReview || reviewRating === 0}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {submittingReview ? 'Submitting...' : reviewSubmitted ? 'Thank you!' : 'Submit Review'}
              </button>
              <button
                onClick={() => {
                  setShowReviewModal(false);
                  setReviewRating(0);
                  setReviewComment('');
                  setReviewSessionId(null);
                }}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400"
              >
                Skip
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 