'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useSidebar } from '../../../contexts/SidebarContext';
import { supabase } from '../../../lib/supabase/client';
import { 
  FaPlus, FaExclamationTriangle,
  FaArrowLeft, FaArrowRight, FaTimes, FaCalendarAlt, FaEye, FaEdit, FaTrash, FaSave
} from 'react-icons/fa';

interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  type: 'vehicle_pickup' | 'vehicle_return' | 'booking_extension' | 'early_return' | 'late_return' | 
        'scheduled_maintenance' | 'emergency_repair' | 'oil_change' | 'tire_replacement' | 'brake_service' |
        'pco_renewal' | 'insurance_renewal' | 'mot_test' | 'document_expiry' | 'compliance_check' |
        'payment_due' | 'commission_payment' | 'invoice_generation' | 'tax_filing' | 'budget_review' | 
        'team_meeting' | 'staff_assignment' | 'partner_assignment' | 'training_session' | 'performance_review' | 'custom';
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'overdue';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  vehicle_id?: string;
  driver_id?: string;
  booking_id?: string;
  maintenance_id?: string;
  location?: string;
  notes?: string;
  reminder_days?: number;
  recurring?: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';
  recurring_end_date?: string;
  created_by: string;
  assigned_to?: string;
  attendees?: string[];
  is_team_event?: boolean;
  meeting_link?: string;
  created_at: string;
  updated_at: string;
  // Extended fields for display
  created_by_name?: string;
  created_by_type?: 'PARTNER' | 'PARTNER_STAFF';
  assigned_to_name?: string;
  assigned_to_type?: 'PARTNER' | 'PARTNER_STAFF';
  partner_id?: string;
}

interface Vehicle {
  id: string;
  make: string;
  model: string;
  license_plate: string;
  year: number;
  status: string;
}

interface Driver {
  id: string;
  full_name: string;
  email: string;
  phone: string;
}

interface PartnerStaff {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  role: string;
  partner_id: string;
  is_active: boolean;
}

interface Partner {
  id: string;
  company_name: string;
  contact_name: string;
  email: string;
  phone: string;
  is_active: boolean;
}

export default function CalendarPage() {
  const { user } = useAuth();
  const { isCollapsed, isMobile } = useSidebar();
  const [events, setEvents] = useState<CalendarEvent[]>([]);

  // Function to close sidebar when modals open
  const closeSidebarOnModalOpen = () => {
    if (!isMobile && !isCollapsed) {
      const sidebar = document.getElementById('partner-sidebar');
      if (sidebar) {
        const collapseButton = sidebar.querySelector('button[onclick*="setSidebarCollapsed"]') as HTMLButtonElement;
        if (collapseButton) {
          collapseButton.click();
        }
      }
    }
  };
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [partnerStaff, setPartnerStaff] = useState<PartnerStaff[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Calendar state
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('month');
  const [_selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [activeCalendar, setActiveCalendar] = useState<'personal' | 'team' | 'organizational' | 'all'>('all');
  const [expandedDate, setExpandedDate] = useState<Date | null>(null);
  const [showDateEventsModal, setShowDateEventsModal] = useState(false);
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Search states for comprehensive form
  const [vehicleSearch, setVehicleSearch] = useState('');
  const [driverSearch, setDriverSearch] = useState('');
  const [staffSearch, setStaffSearch] = useState('');
  const [partnerSearch, setPartnerSearch] = useState('');
  const [selectAllStaff, setSelectAllStaff] = useState(false);
  
  // Dropdown visibility states
  const [showVehicleDropdown, setShowVehicleDropdown] = useState(false);
  const [showDriverDropdown, setShowDriverDropdown] = useState(false);
  const [showStaffDropdown, setShowStaffDropdown] = useState(false);
  const [showPartnerDropdown, setShowPartnerDropdown] = useState(false);

  // Advanced assignment states
  const [assignmentType, setAssignmentType] = useState('direct');
  const [autoEscalate, setAutoEscalate] = useState(false);
  const [requireConfirmation, setRequireConfirmation] = useState(false);
  const [sendNotifications, setSendNotifications] = useState(true);
  const [slaDeadline, setSlaDeadline] = useState('');
  const [escalationLevel, setEscalationLevel] = useState('none');
  const [estimatedHours, setEstimatedHours] = useState('');

  // Dependencies and related items
  const [dependencies, setDependencies] = useState('');
  const [relatedItems, setRelatedItems] = useState('');

  // Cost and budget tracking
  const [estimatedCost, setEstimatedCost] = useState('');
  const [budgetCategory, setBudgetCategory] = useState('');
  const [approvalRequired, setApprovalRequired] = useState('none');

  // Risk assessment
  const [riskLevel, setRiskLevel] = useState('low');
  const [mitigationStrategy, setMitigationStrategy] = useState('');

  // Communication preferences
  const [emailNotification, setEmailNotification] = useState(true);
  const [smsNotification, setSmsNotification] = useState(false);
  const [inAppNotification, setInAppNotification] = useState(true);

  // Event mode toggle
  const [eventMode, setEventMode] = useState<'simple' | 'advanced'>('simple');

  // Form data with all comprehensive fields
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    start_date: '',
    end_date: '',
    type: 'custom' as CalendarEvent['type'],
    status: 'scheduled' as CalendarEvent['status'],
    priority: 'medium' as CalendarEvent['priority'],
    vehicle_id: '',
    driver_id: '',
    booking_id: '',
    maintenance_id: '',
    location: '',
    notes: '',
    reminder_days: 1,
    recurring: 'none' as CalendarEvent['recurring'],
    recurring_end_date: '',
    created_by: '',
    assigned_to: '',
    attendees: [] as string[],
    is_team_event: false,
    meeting_link: '',
    partner_id: ''
  });

  const loadCalendarData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Load vehicles
      const { data: vehiclesData, error: vehiclesError } = await supabase
        .from('vehicles')
        .select('*')
        .eq('partner_id', user?.id)
        .eq('is_active', true);

      if (vehiclesError) throw vehiclesError;
      setVehicles(vehiclesData || []);

      // Load drivers
      const { data: driversData, error: driversError } = await supabase
        .from('drivers')
        .select('*')
        .eq('partner_id', user?.id)
        .eq('is_active', true);

      if (driversError) throw driversError;
      setDrivers(driversData || []);

      // Load partner staff - handle both partner and partner staff users
      let partnerId = user?.id;
      if (user?.role === 'PARTNER_STAFF') {
        // For partner staff, get their partner_id
        const { data: staffData } = await supabase
          .from('partner_staff')
          .select('partner_id')
          .eq('user_id', user?.id)
          .single();
        
        if (staffData?.partner_id) {
          partnerId = staffData.partner_id;
        }
      }

      const { data: staffData, error: staffError } = await supabase
        .from('partner_staff')
        .select('*')
        .eq('partner_id', partnerId)
        .eq('is_active', true);

      if (staffError) throw staffError;
      setPartnerStaff(staffData || []);

      // Load partners (for assignments)
      const { data: partnersData, error: partnersError } = await supabase
        .from('partners')
        .select('*')
        .eq('is_active', true);

      if (partnersError) throw partnersError;
      setPartners(partnersData || []);

      // Load calendar events based on calendar type
      // 
      // Calendar Type Definitions:
      // - Personal: Events created by the user AND not marked as team events
      // - Team: Events assigned to user, user is attendee, or team events (excluding personal events)
      // - Organizational: Events in user's organization but not created by user (excluding personal/team events)
      // - All: Combination of personal, team, and organizational events
      //
      let eventsQuery = supabase.from('calendar_events').select('*');
      
      switch (activeCalendar) {
        case 'personal':
          // Personal events: ONLY created by the user AND not team events
          eventsQuery = eventsQuery.eq('created_by', user?.id).eq('is_team_event', false);
          break;
        case 'team':
          // Team events: 
          // 1. Events assigned to the user (but not created by them)
          // 2. Events where user is an attendee (but not created by them)
          // 3. Team events created by the user
          // 4. Team events assigned to the user
          eventsQuery = eventsQuery.or(
            `and(assigned_to.eq.${user?.id},created_by.neq.${user?.id}),` +
            `and(attendees.cs.{${user?.id}},created_by.neq.${user?.id}),` +
            `and(is_team_event.eq.true,created_by.eq.${user?.id}),` +
            `and(is_team_event.eq.true,assigned_to.eq.${user?.id})`
          );
          break;
        case 'organizational':
          // Organizational events: 
          // 1. Events with partner_id matching user's partner (but not created by user)
          // 2. Events created by other staff in the same organization
          if (user?.role === 'PARTNER') {
            eventsQuery = eventsQuery.eq('partner_id', user?.id).neq('created_by', user?.id);
          } else if (user?.role === 'PARTNER_STAFF') {
            // For partner staff, use the partnerId we already determined
            if (partnerId) {
              eventsQuery = eventsQuery.eq('partner_id', partnerId).neq('created_by', user?.id);
            }
          }
          break;
        case 'all':
        default:
          // All events: personal + team + organizational
          if (user?.role === 'PARTNER') {
            eventsQuery = eventsQuery.or(
              `partner_id.eq.${user?.id},` +
              `created_by.eq.${user?.id},` +
              `assigned_to.eq.${user?.id},` +
              `attendees.cs.{${user?.id}}`
            );
          } else if (user?.role === 'PARTNER_STAFF') {
            // For partner staff, use the partnerId we already determined
            if (partnerId) {
              eventsQuery = eventsQuery.or(
                `partner_id.eq.${partnerId},` +
                `created_by.eq.${user?.id},` +
                `assigned_to.eq.${user?.id},` +
                `attendees.cs.{${user?.id}}`
              );
            } else {
              eventsQuery = eventsQuery.or(
                `created_by.eq.${user?.id},` +
                `assigned_to.eq.${user?.id},` +
                `attendees.cs.{${user?.id}}`
              );
            }
          }
          break;
      }
      
      const { data: eventsData, error: eventsError } = await eventsQuery.order('start_date', { ascending: true });

      if (eventsError) throw eventsError;

      // Optimize: Get all unique user IDs to fetch in batch instead of individual queries
      const uniqueUserIds = new Set<string>();
      (eventsData || []).forEach(event => {
        if (event.created_by) uniqueUserIds.add(event.created_by);
        if (event.assigned_to) uniqueUserIds.add(event.assigned_to);
      });

      // Batch fetch all users (partners and staff) in one query
      const userIds = Array.from(uniqueUserIds);
      let allUsers: { [key: string]: { name: string; type: 'PARTNER' | 'PARTNER_STAFF' } } = {};

      if (userIds.length > 0) {
        // Fetch partners
        const { data: partnersData } = await supabase
          .from('partners')
          .select('id, company_name, contact_name')
          .in('id', userIds);

        // Fetch staff
        const { data: staffData } = await supabase
          .from('partner_staff')
          .select('id, full_name, role')
          .in('id', userIds);

        // Build lookup object
        (partnersData || []).forEach(partner => {
          allUsers[partner.id] = {
            name: `${partner.company_name} (${partner.contact_name})`,
            type: 'PARTNER'
          };
        });

        (staffData || []).forEach(staff => {
          allUsers[staff.id] = {
            name: `${staff.full_name} (${staff.role})`,
            type: 'PARTNER_STAFF'
          };
        });
      }

      // Enhance events with creator and assignee information (now using cached data)
      const enhancedEvents = (eventsData || []).map((event) => {
        const createdByUser = event.created_by ? allUsers[event.created_by] : null;
        const assignedToUser = event.assigned_to ? allUsers[event.assigned_to] : null;

        return {
          ...event,
          created_by_name: createdByUser?.name || '',
          created_by_type: createdByUser?.type || 'PARTNER',
          assigned_to_name: assignedToUser?.name || '',
          assigned_to_type: assignedToUser?.type || 'PARTNER'
        };
      });

      setEvents(enhancedEvents);

    } catch (error) {
      // Log error for debugging
      setError(`Failed to load calendar data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  }, [user?.id, activeCalendar, user?.role]);

  useEffect(() => {
    if (user) {
      loadCalendarData();
    }
  }, [user, loadCalendarData, activeCalendar]);



  // Calendar navigation
  const goToPrevious = () => {
    const newDate = new Date(currentDate);
    switch (viewMode) {
      case 'day':
        newDate.setDate(newDate.getDate() - 1);
        break;
      case 'week':
        newDate.setDate(newDate.getDate() - 7);
        break;
      case 'month':
        newDate.setMonth(newDate.getMonth() - 1);
        break;
    }
    setCurrentDate(newDate);
  };

  const goToNext = () => {
    const newDate = new Date(currentDate);
    switch (viewMode) {
      case 'day':
        newDate.setDate(newDate.getDate() + 1);
        break;
      case 'week':
        newDate.setDate(newDate.getDate() + 7);
        break;
      case 'month':
        newDate.setMonth(newDate.getMonth() + 1);
        break;
    }
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(new Date());
  };

  // Get events for a specific date
  const getEventsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return events.filter(event => {
      const eventDate = new Date(event.start_date).toISOString().split('T')[0];
      return eventDate === dateStr;
    });
  };

  // Get events for a date range
  const _getEventsForDateRange = (startDate: Date, endDate: Date) => {
    return events.filter(event => {
      const eventDate = new Date(event.start_date);
      return eventDate >= startDate && eventDate <= endDate;
    });
  };

  // Format date for display
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-GB', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Get calendar days for month view
  const getCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    const current = new Date(startDate);
    
    while (current <= lastDay || current.getDay() !== 0) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    
    return days;
  };

  // Get week days
  const getWeekDays = () => {
    const startOfWeek = new Date(currentDate);
    const day = startOfWeek.getDay();
    startOfWeek.setDate(startOfWeek.getDate() - day);
    
    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(date.getDate() + i);
      days.push(date);
    }
    
    return days;
  };

  // Event type definitions
  const eventTypes = {
    vehicle_pickup: { label: 'Vehicle Pickup', color: 'bg-blue-100 text-blue-800 border-blue-200', icon: '🚗' },
    vehicle_return: { label: 'Vehicle Return', color: 'bg-green-100 text-green-800 border-green-200', icon: '🔙' },
    booking_extension: { label: 'Booking Extension', color: 'bg-purple-100 text-purple-800 border-purple-200', icon: '⏰' },
    early_return: { label: 'Early Return', color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: '⚡' },
    late_return: { label: 'Late Return', color: 'bg-red-100 text-red-800 border-red-200', icon: '⚠️' },
    scheduled_maintenance: { label: 'Scheduled Maintenance', color: 'bg-orange-100 text-orange-800 border-orange-200', icon: '🔧' },
    emergency_repair: { label: 'Emergency Repair', color: 'bg-red-100 text-red-800 border-red-200', icon: '🚨' },
    oil_change: { label: 'Oil Change', color: 'bg-amber-100 text-amber-800 border-amber-200', icon: '🛢️' },
    tire_replacement: { label: 'Tire Replacement', color: 'bg-gray-100 text-gray-800 border-gray-200', icon: '🛞' },
    brake_service: { label: 'Brake Service', color: 'bg-red-100 text-red-800 border-red-200', icon: '🛑' },
    pco_renewal: { label: 'PCO License Renewal', color: 'bg-indigo-100 text-indigo-800 border-indigo-200', icon: '📋' },
    insurance_renewal: { label: 'Insurance Renewal', color: 'bg-blue-100 text-blue-800 border-blue-200', icon: '🛡️' },
    mot_test: { label: 'MOT Test', color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: '✅' },
    document_expiry: { label: 'Document Expiry', color: 'bg-red-100 text-red-800 border-red-200', icon: '📄' },
    compliance_check: { label: 'Compliance Check', color: 'bg-purple-100 text-purple-800 border-purple-200', icon: '🔍' },
    payment_due: { label: 'Payment Due', color: 'bg-green-100 text-green-800 border-green-200', icon: '💰' },
    commission_payment: { label: 'Commission Payment', color: 'bg-emerald-100 text-emerald-800 border-emerald-200', icon: '💸' },
    invoice_generation: { label: 'Invoice Generation', color: 'bg-blue-100 text-blue-800 border-blue-200', icon: '🧾' },
    tax_filing: { label: 'Tax Filing', color: 'bg-red-100 text-red-800 border-red-200', icon: '📊' },
    budget_review: { label: 'Budget Review', color: 'bg-purple-100 text-purple-800 border-purple-200', icon: '📈' },
    team_meeting: { label: 'Team Meeting', color: 'bg-indigo-100 text-indigo-800 border-indigo-200', icon: '👥' },
    staff_assignment: { label: 'Staff Assignment', color: 'bg-blue-100 text-blue-800 border-blue-200', icon: '👤' },
    partner_assignment: { label: 'Partner Assignment', color: 'bg-purple-100 text-purple-800 border-purple-200', icon: '🤝' },
    training_session: { label: 'Training Session', color: 'bg-green-100 text-green-800 border-green-200', icon: '🎓' },
    performance_review: { label: 'Performance Review', color: 'bg-orange-100 text-orange-800 border-orange-200', icon: '📊' },
    custom: { label: 'Custom Event', color: 'bg-gray-100 text-gray-800 border-gray-200', icon: '📝' }
  };

  // Event type colors
  const getEventTypeColor = (type: CalendarEvent['type']) => {
    return eventTypes[type]?.color || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  // Filtered search results
  const filteredVehicles = useMemo(() => {
    if (!vehicleSearch.trim()) return vehicles;
    return vehicles.filter(vehicle => 
      vehicle.make.toLowerCase().includes(vehicleSearch.toLowerCase()) ||
      vehicle.model.toLowerCase().includes(vehicleSearch.toLowerCase()) ||
      vehicle.license_plate.toLowerCase().includes(vehicleSearch.toLowerCase())
    );
  }, [vehicles, vehicleSearch]);

  const filteredDrivers = useMemo(() => {
    if (!driverSearch.trim()) return drivers;
    return drivers.filter(driver => 
      driver.full_name.toLowerCase().includes(driverSearch.toLowerCase()) ||
      driver.email.toLowerCase().includes(driverSearch.toLowerCase())
    );
  }, [drivers, driverSearch]);

  const filteredStaff = useMemo(() => {
    if (!staffSearch.trim()) return partnerStaff;
    return partnerStaff.filter(staff => 
      staff.full_name.toLowerCase().includes(staffSearch.toLowerCase()) ||
      staff.email.toLowerCase().includes(staffSearch.toLowerCase()) ||
      staff.role.toLowerCase().includes(staffSearch.toLowerCase())
    );
  }, [partnerStaff, staffSearch]);

  const filteredPartners = useMemo(() => {
    if (!partnerSearch.trim()) return partners;
    return partners.filter(partner => 
      partner.company_name.toLowerCase().includes(partnerSearch.toLowerCase()) ||
      partner.contact_name.toLowerCase().includes(partnerSearch.toLowerCase()) ||
      partner.email.toLowerCase().includes(partnerSearch.toLowerCase())
    );
  }, [partners, partnerSearch]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!(event.target as Element).closest('.search-dropdown')) {
        setShowVehicleDropdown(false);
        setShowDriverDropdown(false);
        setShowStaffDropdown(false);
        setShowPartnerDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Priority colors
  const getPriorityColor = (priority: CalendarEvent['priority']) => {
    switch (priority) {
      case 'urgent': return 'border-red-500';
      case 'high': return 'border-orange-500';
      case 'medium': return 'border-yellow-500';
      case 'low': return 'border-green-500';
      default: return 'border-gray-300';
    }
  };

  // Get calendar type for an event
  const getCalendarType = (event: CalendarEvent) => {
    // Personal: Created by the user AND not a team event
    if (event.created_by === user?.id && !event.is_team_event) {
      return { type: 'personal', label: 'Personal Event', color: 'bg-green-100 text-green-800', icon: '👤' };
    } 
    // Team: Either assigned to user, user is attendee, or it's a team event
    else if (event.assigned_to === user?.id || event.attendees?.includes(user?.id || '') || event.is_team_event) {
      return { type: 'team', label: 'Team Event', color: 'bg-purple-100 text-purple-800', icon: '👥' };
    } 
    // Organizational: Has partner_id and matches user's partner organization
    else if (event.partner_id) {
      // For partners, check if it's their organization
      if (user?.role === 'PARTNER' && event.partner_id === user?.id) {
        return { type: 'organizational', label: 'Organizational Event', color: 'bg-orange-100 text-orange-800', icon: '🏢' };
      }
      // For partner staff, check if it's their partner's organization
      if (user?.role === 'PARTNER_STAFF') {
        // We'll determine this based on the partner_id matching the staff's partner
        const staffPartner = partnerStaff.find(staff => staff.id === user?.id)?.partner_id;
        if (staffPartner && event.partner_id === staffPartner) {
          return { type: 'organizational', label: 'Organizational Event', color: 'bg-orange-100 text-orange-800', icon: '🏢' };
        }
      }
    }
    // Other: Fallback for any other events
    return { type: 'other', label: 'Other Event', color: 'bg-gray-100 text-gray-800', icon: '📅' };
  };

  // Handle adding new event
  const handleAddEvent = () => {
    setIsEditing(false);
    setSelectAllStaff(false);
    setFormData({
      title: '',
      description: '',
      start_date: '',
      end_date: '',
      type: 'custom',
      status: 'scheduled',
      priority: 'medium',
      vehicle_id: '',
      driver_id: '',
      booking_id: '',
      maintenance_id: '',
      location: '',
      notes: '',
      reminder_days: 1,
      recurring: 'none',
      recurring_end_date: '',
      created_by: '',
      assigned_to: '',
      attendees: [],
      is_team_event: false,
      meeting_link: '',
      partner_id: ''
    });
    closeSidebarOnModalOpen();
    setShowAddModal(true);
  };

  // Handle calendar tile click
  const handleCalendarTileClick = (date: Date) => {
    setIsEditing(false);
    const dateStr = date.toISOString().slice(0, 16);
    setFormData(prev => ({
      ...prev,
      start_date: dateStr,
      end_date: dateStr
    }));
    closeSidebarOnModalOpen();
    setShowAddModal(true);
  };

  // Handle date expansion click
  const handleDateExpandClick = (date: Date) => {
    // Open the modal immediately for snappier UX
    setExpandedDate(date);
    setShowDateEventsModal(true);

    // Then collapse the sidebar (non-blocking)
    closeSidebarOnModalOpen();
  };

  // Get events for a specific date
  const getEventsForSpecificDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return events.filter(event => {
      const eventDate = new Date(event.start_date).toISOString().split('T')[0];
      return eventDate === dateStr;
    });
  };

  // Handle editing event
  const handleEditEvent = (event: CalendarEvent) => {
    setIsEditing(true);
    setSelectedEvent(event);
    setSelectAllStaff(event.attendees?.includes('all_staff') || false);
    setFormData({
      title: event.title,
      description: event.description,
      start_date: event.start_date.slice(0, 16),
      end_date: event.end_date.slice(0, 16),
      type: event.type,
      status: event.status,
      priority: event.priority,
      vehicle_id: event.vehicle_id || '',
      driver_id: event.driver_id || '',
      booking_id: event.booking_id || '',
      maintenance_id: event.maintenance_id || '',
      location: event.location || '',
      notes: event.notes || '',
      reminder_days: event.reminder_days || 1,
      recurring: event.recurring || 'none',
      recurring_end_date: event.recurring_end_date || '',
      is_team_event: event.is_team_event || false,
      meeting_link: event.meeting_link || '',
      created_by: event.created_by,
      assigned_to: event.assigned_to || '',
      attendees: event.attendees || [],
      partner_id: event.partner_id || ''
    });
    closeSidebarOnModalOpen();
    setShowEditModal(true);
  };

  // Handle deleting event
  const handleDeleteEvent = (event: CalendarEvent) => {
    setSelectedEvent(event);
    closeSidebarOnModalOpen();
    setShowDeleteModal(true);
  };

  // Handle saving event
  const saveEvent = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      // Prepare attendees array based on selections
      let attendees: string[] = [];
      
      // If broadcast to all staff is selected, add all partner staff
      if (selectAllStaff) {
        attendees = partnerStaff.map(staff => staff.id);
      }
      
      // Add assigned person if selected
      if (formData.assigned_to) {
        attendees.push(formData.assigned_to);
      }

      // Remove duplicates
      attendees = Array.from(new Set(attendees));

      const eventData = {
        title: formData.title,
        description: formData.description,
        start_date: formData.start_date,
        end_date: formData.end_date || formData.start_date,
        type: formData.type,
        status: formData.status,
        priority: formData.priority,
        vehicle_id: formData.vehicle_id || null,
        driver_id: formData.driver_id || null,
        booking_id: formData.booking_id || null,
        maintenance_id: formData.maintenance_id || null,
        location: formData.location,
        notes: formData.notes,
        reminder_days: formData.reminder_days,
        recurring: formData.recurring,
        recurring_end_date: formData.recurring_end_date,
        meeting_link: formData.meeting_link,
        created_by: user.id,
        assigned_to: formData.assigned_to || null,
        attendees: attendees,
        is_team_event: formData.is_team_event,
        partner_id: (user as any).partner_id || user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      if (isEditing && selectedEvent) {
        // Update existing event
        const { error: updateError } = await supabase
          .from('calendar_events')
          .update(eventData)
          .eq('id', selectedEvent.id);

        if (updateError) throw updateError;
      } else {
        // Create new event
        const { error: insertError } = await supabase
          .from('calendar_events')
          .insert([eventData]);

        if (insertError) throw insertError;
      }

      // Reset form and close modal
      setFormData({
        title: '',
        description: '',
        start_date: '',
        end_date: '',
        type: 'custom',
        status: 'scheduled',
        priority: 'medium',
        vehicle_id: '',
        driver_id: '',
        booking_id: '',
        maintenance_id: '',
        location: '',
        notes: '',
        reminder_days: 1,
        recurring: 'none',
        recurring_end_date: '',
        created_by: '',
        assigned_to: '',
        attendees: [],
        is_team_event: false,
        meeting_link: '',
        partner_id: ''
      });

      // Reset search fields
      setVehicleSearch('');
      setDriverSearch('');
      setStaffSearch('');
      setPartnerSearch('');
      setSelectAllStaff(false);

      // Close dropdowns
      setShowVehicleDropdown(false);
      setShowDriverDropdown(false);
      setShowStaffDropdown(false);
      setShowPartnerDropdown(false);

      setShowAddModal(false);
      setShowEditModal(false);
      setIsEditing(false);
      setSelectedEvent(null);

      // Reload calendar data
      await loadCalendarData();

    } catch (error) {
      console.error('Error saving event:', error);
      setError(error instanceof Error ? error.message : 'Failed to save event');
    } finally {
      setLoading(false);
    }
  };

  // Handle deleting event
  const deleteEvent = async () => {
    try {
      setError(null);
      
      if (!selectedEvent) return;

      const { error: deleteError } = await supabase
        .from('calendar_events')
        .delete()
        .eq('id', selectedEvent.id);

      if (deleteError) throw deleteError;

      setShowDeleteModal(false);
      setSelectedEvent(null);
      await loadCalendarData();
      
    } catch (error) {
      // Handle error silently
      setError('Failed to delete event');
    }
  };

  // Handle event click
  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
    closeSidebarOnModalOpen();
    setShowEventModal(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading calendar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm shadow-lg border-b border-gray-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Calendar Dashboard
              </h1>
              <p className="mt-2 text-lg text-gray-600">
                Manage bookings, maintenance, and important events with your team
              </p>
            </div>
            <div className="mt-6 sm:mt-0 flex space-x-4">
              <button
                onClick={handleAddEvent}
                className="inline-flex items-center px-6 py-3 border border-transparent rounded-xl shadow-lg text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transform hover:scale-105 transition-all duration-200"
              >
                <FaPlus className="w-5 h-5 mr-2" />
                Add Event
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Calendar Type Tabs */}
        <div className="bg-white/90 backdrop-blur-sm p-6 rounded-2xl shadow-xl border border-gray-200/50 mb-6">
          <div className="flex flex-wrap items-center justify-center space-x-2">
            <button
              onClick={() => {
                // Close all modals when changing calendar type
                setShowAddModal(false);
                setShowEditModal(false);
                setShowDeleteModal(false);
                setShowEventModal(false);
                setShowDateEventsModal(false);
                setActiveCalendar('all');
              }}
              className={`px-6 py-3 text-sm font-semibold rounded-xl ${
                activeCalendar === 'all' 
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              📅 All Events
            </button>
            <button
              onClick={() => {
                // Close all modals when changing calendar type
                setShowAddModal(false);
                setShowEditModal(false);
                setShowDeleteModal(false);
                setShowEventModal(false);
                setShowDateEventsModal(false);
                setActiveCalendar('personal');
              }}
              className={`px-6 py-3 text-sm font-semibold rounded-xl ${
                activeCalendar === 'personal' 
                  ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              👤 Personal
            </button>
            <button
              onClick={() => {
                // Close all modals when changing calendar type
                setShowAddModal(false);
                setShowEditModal(false);
                setShowDeleteModal(false);
                setShowEventModal(false);
                setShowDateEventsModal(false);
                setActiveCalendar('team');
              }}
              className={`px-6 py-3 text-sm font-semibold rounded-xl ${
                activeCalendar === 'team' 
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              👥 Team
            </button>
            <button
              onClick={() => {
                // Close all modals when changing calendar type
                setShowAddModal(false);
                setShowEditModal(false);
                setShowDeleteModal(false);
                setShowEventModal(false);
                setShowDateEventsModal(false);
                setActiveCalendar('organizational');
              }}
              className={`px-6 py-3 text-sm font-semibold rounded-xl ${
                activeCalendar === 'organizational' 
                  ? 'bg-gradient-to-r from-orange-600 to-red-600 text-white shadow-lg' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              🏢 Organizational
            </button>
          </div>
          
          {/* Calendar Type Description */}
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600">
              {activeCalendar === 'all' && 'View all your events across personal, team, and organizational calendars'}
              {activeCalendar === 'personal' && 'Your personal events and tasks'}
              {activeCalendar === 'team' && 'Events shared with your team members'}
              {activeCalendar === 'organizational' && 'Business events and operations'}
            </p>
          </div>
        </div>

        {/* Calendar Controls */}
        <div className="bg-white/90 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-gray-200/50 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center space-x-6 mb-6 sm:mb-0">
              <button
                onClick={() => {
                  // Close all modals when navigating
                  setShowAddModal(false);
                  setShowEditModal(false);
                  setShowDeleteModal(false);
                  setShowEventModal(false);
                  setShowDateEventsModal(false);
                  goToPrevious();
                }}
                className="p-3 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl"
              >
                <FaArrowLeft className="w-5 h-5" />
              </button>
              
              <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4">
                <h2 className="text-2xl font-bold text-gray-800">
                  {viewMode === 'day' && formatDate(currentDate)}
                  {viewMode === 'week' && `${formatDate(getWeekDays()[0])} - ${formatDate(getWeekDays()[6])}`}
                  {viewMode === 'month' && currentDate.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
                </h2>
              </div>
              
              <button
                onClick={() => {
                  // Close all modals when navigating
                  setShowAddModal(false);
                  setShowEditModal(false);
                  setShowDeleteModal(false);
                  setShowEventModal(false);
                  setShowDateEventsModal(false);
                  goToNext();
                }}
                className="p-3 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl"
              >
                <FaArrowRight className="w-5 h-5" />
              </button>
              
              <button
                onClick={() => {
                  // Close all modals when navigating
                  setShowAddModal(false);
                  setShowEditModal(false);
                  setShowDeleteModal(false);
                  setShowEventModal(false);
                  setShowDateEventsModal(false);
                  goToToday();
                }}
                className="px-6 py-2 text-sm font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-xl"
              >
                Today
              </button>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={() => {
                  // Close all modals when changing view mode
                  setShowAddModal(false);
                  setShowEditModal(false);
                  setShowDeleteModal(false);
                  setShowEventModal(false);
                  setShowDateEventsModal(false);
                  setViewMode('day');
                }}
                className={`px-4 py-2 text-sm font-semibold rounded-xl ${
                  viewMode === 'day' 
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                Day
              </button>
              <button
                onClick={() => {
                  // Close all modals when changing view mode
                  setShowAddModal(false);
                  setShowEditModal(false);
                  setShowDeleteModal(false);
                  setShowEventModal(false);
                  setShowDateEventsModal(false);
                  setViewMode('week');
                }}
                className={`px-4 py-2 text-sm font-semibold rounded-xl ${
                  viewMode === 'week' 
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                Week
              </button>
              <button
                onClick={() => {
                  // Close all modals when changing view mode
                  setShowAddModal(false);
                  setShowEditModal(false);
                  setShowDeleteModal(false);
                  setShowEventModal(false);
                  setShowDateEventsModal(false);
                  setViewMode('month');
                }}
                className={`px-4 py-2 text-sm font-semibold rounded-xl ${
                  viewMode === 'month' 
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                Month
              </button>
            </div>
          </div>
        </div>

        {/* Calendar View */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50">
          {viewMode === 'month' && (
            <div className="p-8">
              {/* Week day headers */}
              <div className="grid grid-cols-7 gap-2 mb-4">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="p-4 text-center text-sm font-bold text-gray-600 bg-gray-50/50 rounded-xl">
                    {day}
                  </div>
                ))}
              </div>
              
              {/* Calendar grid */}
              <div className="grid grid-cols-7 gap-2">
                {getCalendarDays().map((date, index) => {
                  const isCurrentMonth = date.getMonth() === currentDate.getMonth();
                  const isToday = date.toDateString() === new Date().toDateString();
                  const dayEvents = getEventsForDate(date);
                  
                  return (
                    <div
                      key={index}
                      className={`min-h-[160px] p-4 border rounded-xl relative cursor-pointer group ${
                        isCurrentMonth ? 'bg-white/80' : 'bg-gray-50/50'
                      } ${
                        isToday 
                          ? 'bg-gradient-to-br from-blue-100 via-purple-50 to-indigo-100 border-2 border-blue-500 shadow-xl ring-2 ring-blue-200 ring-opacity-50 transform scale-105' 
                          : 'border border-gray-200/50 hover:bg-blue-50/50 hover:border-blue-200'
                      }`}
                      onClick={() => {
                        const hasEvents = dayEvents.length > 0;
                        if (hasEvents) {
                          // Show all events for this date
                          setExpandedDate(date);
                          setShowDateEventsModal(true);
                        } else {
                          // No events yet – open Add Event modal pre-filled for this date
                          const dateStr = date.toISOString().slice(0, 16);
                          setIsEditing(false);
                          setFormData(prev => ({
                            ...prev,
                            title: '',
                            description: '',
                            start_date: dateStr,
                            end_date: dateStr,
                            type: 'custom'
                          }));
                          closeSidebarOnModalOpen();
                          setShowAddModal(true);
                        }
                      }}
                    >
                      {/* Today indicator */}
                      {isToday && (
                        <div className="absolute -top-2 -left-2 z-10">
                          <div className="bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
                            TODAY
                          </div>
                        </div>
                      )}
                      
                      {/* Date header with expand button */}
                      <div className="flex justify-between items-center mb-2">
                        <div className={`text-lg font-bold ${
                          isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
                        } ${isToday ? 'text-blue-700' : ''}`}>
                          {date.getDate()}
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDateExpandClick(date);
                          }}
                          className={`w-6 h-6 rounded-full flex items-center justify-center ${
                            isToday 
                              ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md' 
                              : 'bg-blue-100 hover:bg-blue-200 text-blue-600'
                          }`}
                          title="View all events for this date"
                        >
                          <span className="text-xs">+</span>
                        </button>
                      </div>
                      
                      {/* Add event button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCalendarTileClick(date);
                        }}
                        className={`w-full mb-2 py-1 px-2 rounded text-xs ${
                          isToday 
                            ? 'bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-md' 
                            : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                        }`}
                      >
                        + Add Event
                      </button>
                      
                      {/* Scrollable events container */}
                      <div className="relative">
                        <div className="max-h-[80px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 pr-1 group/events">
                          <div className="space-y-1">
                            {dayEvents.map(event => (
                              <div
                                key={event.id}
                                className={`text-xs p-1.5 rounded-lg cursor-pointer border-l-4 shadow-sm hover:shadow-md ${getEventTypeColor(event.type)} ${getPriorityColor(event.priority)} group relative`}
                              >
                                <div 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEventClick(event);
                                  }}
                                  className="font-semibold truncate pr-6"
                                >
                                  {event.title}
                                </div>
                                {/* Calendar type indicator */}
                                <div className="absolute left-1 top-1">
                                  {event.created_by === user?.id && (
                                    <span className="w-2 h-2 bg-green-500 rounded-full" title="Personal Event"></span>
                                  )}
                                  {event.assigned_to === user?.id && (
                                    <span className="w-2 h-2 bg-purple-500 rounded-full" title="Team Event"></span>
                                  )}
                                  {event.partner_id === user?.id && event.created_by !== user?.id && event.assigned_to !== user?.id && (
                                    <span className="w-2 h-2 bg-orange-500 rounded-full" title="Organizational Event"></span>
                                  )}
                                </div>
                                {/* Show creator/assignee info */}
                                {(event.created_by_name || event.assigned_to_name) && (
                                  <div className="text-xs opacity-75 truncate mt-1">
                                                                     {event.created_by_name && (
                                       <span className="inline-flex items-center">
                                         <span className="w-2 h-2 rounded-full bg-blue-400 mr-1"></span>
                                         {event.created_by_type === 'PARTNER' ? '👤' : '👨‍💼'} {event.created_by_name}
                                       </span>
                                     )}
                                     {event.assigned_to_name && event.created_by_name && (
                                       <span className="mx-1">→</span>
                                     )}
                                     {event.assigned_to_name && (
                                       <span className="inline-flex items-center">
                                         <span className="w-2 h-2 rounded-full bg-green-400 mr-1"></span>
                                         {event.assigned_to_type === 'PARTNER' ? '👤' : '👨‍💼'} {event.assigned_to_name}
                                       </span>
                                     )}
                                  </div>
                                )}
                                <div className="absolute right-1 top-1 opacity-0 group-hover:opacity-100">
                                  <div className="flex space-x-1">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleEditEvent(event);
                                      }}
                                      className="w-3 h-3 bg-blue-500 rounded-full hover:bg-blue-600"
                                      title="Edit"
                                    />
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteEvent(event);
                                      }}
                                      className="w-3 h-3 bg-red-500 rounded-full hover:bg-red-600"
                                      title="Delete"
                                    />
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                          
                          {/* Scroll hint - appears on hover when there are events */}
                          {dayEvents.length > 0 && (
                            <div className="absolute top-1 right-1 opacity-0 group-hover/events:opacity-100 pointer-events-none">
                              <div className="bg-blue-600 text-white text-xs px-2 py-1 rounded shadow-lg">
                                Scroll to see more
                              </div>
                            </div>
                          )}
                        </div>
                        
                        {/* Scroll indicator - show when there are more events than can fit */}
                        {dayEvents.length > 3 && (
                          <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-white via-white/80 to-transparent pointer-events-none flex items-center justify-center">
                            <div className="flex items-center space-x-1 bg-blue-100 text-blue-600 px-2 py-1 rounded-full text-xs font-medium shadow-sm">
                              <span>📜</span>
                              <span>{dayEvents.length} events</span>
                              <span>↓</span>
                            </div>
                          </div>
                        )}
                        
                        {/* Hover indicator for scrollable content */}
                        {dayEvents.length > 0 && (
                          <div className="absolute top-0 right-0 w-2 h-full bg-gradient-to-b from-blue-100/50 to-transparent pointer-events-none opacity-0 group-hover:opacity-100">
                            <div className="w-full h-full flex items-center justify-center">
                              <div className="w-1 h-8 bg-blue-300 rounded-full"></div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {viewMode === 'week' && (
            <div className="p-6">
              <div className="grid grid-cols-8 gap-1">
                <div className="p-2"></div>
                {getWeekDays().map(date => (
                  <div key={date.toISOString()} className="p-2 text-center text-sm font-medium text-gray-500">
                    <div>{date.toLocaleDateString('en-GB', { weekday: 'short' })}</div>
                    <div className={`text-lg ${date.toDateString() === new Date().toDateString() ? 'text-blue-600' : 'text-gray-900'}`}>
                      {date.getDate()}
                    </div>
                  </div>
                ))}
                
                {/* Time slots */}
                {Array.from({ length: 24 }, (_, hour) => (
                  <React.Fragment key={hour}>
                    <div className="p-2 text-xs text-gray-500 border-r border-gray-200">
                      {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
                    </div>
                    {getWeekDays().map(date => {
                      const dayEvents = getEventsForDate(date).filter(event => {
                        const eventHour = new Date(event.start_date).getHours();
                        return eventHour === hour;
                      });
                      
                      return (
                        <div key={`${date.toISOString()}-${hour}`} className="p-1 border-r border-gray-200 min-h-[60px]">
                          {dayEvents.map(event => (
                            <div
                              key={event.id}
                              onClick={() => handleEventClick(event)}
                              className={`text-xs p-1 rounded cursor-pointer border-l-4 ${getEventTypeColor(event.type)} ${getPriorityColor(event.priority)} mb-1`}
                            >
                              {event.title}
                            </div>
                          )       )}
                        </div>
                      );
                    })}
                  </React.Fragment>
                ))}
              </div>
            </div>
          )}

          {viewMode === 'day' && (
            <div className="p-6">
              <div className="space-y-4">
                {Array.from({ length: 24 }, (_, hour) => {
                  const dayEvents = getEventsForDate(currentDate).filter(event => {
                    const eventHour = new Date(event.start_date).getHours();
                    return eventHour === hour;
                  });
                  
                  return (
                    <div key={hour} className="flex">
                      <div className="w-16 text-sm text-gray-500">
                        {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
                      </div>
                      <div className="flex-1 border-l border-gray-200 pl-4 min-h-[60px]">
                        {dayEvents.map(event => (
                          <div
                            key={event.id}
                            onClick={() => handleEventClick(event)}
                            className={`p-2 rounded cursor-pointer border-l-4 ${getEventTypeColor(event.type)} ${getPriorityColor(event.priority)} mb-2`}
                          >
                            <div className="font-medium">{event.title}</div>
                            <div className="text-xs text-gray-600">{event.description}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="mt-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <FaExclamationTriangle className="w-5 h-5 text-red-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add Event Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content w-full max-w-6xl mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6 p-6 border-b border-gray-200">
              <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Add New Event
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg">
                <FaTimes className="w-6 h-6" />
              </button>
            </div>

            {/* Event Mode Toggle */}
            <div className="px-6 pb-4 border-b border-gray-200">
              <div className="flex items-center justify-center space-x-4">
                <span className="text-sm font-medium text-gray-700">Event Type:</span>
                <div className="flex bg-gray-100 rounded-lg p-1">
                  <button
                    type="button"
                    onClick={() => setEventMode('simple')}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                      eventMode === 'simple'
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    🎯 Simple Event
                  </button>
                  <button
                    type="button"
                    onClick={() => setEventMode('advanced')}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                      eventMode === 'advanced'
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    ⚙️ Advanced Event
                  </button>
                </div>
              </div>
              <p className="text-xs text-gray-500 text-center mt-2">
                {eventMode === 'simple' 
                  ? 'Quick event creation with essential fields only'
                  : 'Comprehensive event with advanced features, assignments, and tracking'
                }
              </p>
            </div>

            <div className="p-6">
              <div className="space-y-6">
                {/* Basic Information - Always shown */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Event Title *</label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      className="block w-full border border-gray-300 rounded-lg shadow-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter event title"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Event Type *</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as CalendarEvent['type'] }))}
                      className="block w-full border border-gray-300 rounded-lg shadow-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      <option value="">Select event type</option>
                      <optgroup label="🚗 Vehicle Events">
                        <option value="vehicle_pickup">🚗 Vehicle Pickup</option>
                        <option value="vehicle_return">🚗 Vehicle Return</option>
                        <option value="scheduled_maintenance">🔧 Scheduled Maintenance</option>
                        <option value="emergency_repair">🚨 Emergency Repair</option>
                        <option value="oil_change">🛢️ Oil Change</option>
                        <option value="tire_replacement">🛞 Tire Replacement</option>
                        <option value="brake_service">🛑 Brake Service</option>
                      </optgroup>
                      <optgroup label="📋 Administrative">
                        <option value="pco_renewal">📋 PCO Renewal</option>
                        <option value="insurance_renewal">🛡️ Insurance Renewal</option>
                        <option value="mot_test">🔍 MOT Test</option>
                        <option value="document_expiry">📄 Document Expiry</option>
                        <option value="compliance_check">✅ Compliance Check</option>
                      </optgroup>
                      <optgroup label="💰 Financial">
                        <option value="payment_due">💰 Payment Due</option>
                        <option value="commission_payment">💸 Commission Payment</option>
                        <option value="invoice_generation">🧾 Invoice Generation</option>
                        <option value="tax_filing">📊 Tax Filing</option>
                        <option value="budget_review">📈 Budget Review</option>
                      </optgroup>
                      <optgroup label="👥 Team & Staff">
                        <option value="team_meeting">👥 Team Meeting</option>
                        <option value="staff_assignment">👨‍💼 Staff Assignment</option>
                        <option value="partner_assignment">🤝 Partner Assignment</option>
                        <option value="training_session">🎓 Training Session</option>
                        <option value="performance_review">📊 Performance Review</option>
                      </optgroup>
                      <optgroup label="📅 Other">
                        <option value="booking_extension">📅 Booking Extension</option>
                        <option value="early_return">⏰ Early Return</option>
                        <option value="late_return">⏰ Late Return</option>
                        <option value="custom">📝 Custom Event</option>
                      </optgroup>
                    </select>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="block w-full border border-gray-300 rounded-lg shadow-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                    placeholder="Enter detailed event description"
                  />
                </div>

                {/* Date & Time */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Start Date & Time *</label>
                    <input
                      type="datetime-local"
                      value={formData.start_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                      className="block w-full border border-gray-300 rounded-lg shadow-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">End Date & Time *</label>
                    <input
                      type="datetime-local"
                      value={formData.end_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                      className="block w-full border border-gray-300 rounded-lg shadow-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                </div>

                {/* Priority & Status - Simple mode shows basic, Advanced shows full */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Priority</label>
                    <select
                      value={formData.priority}
                      onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as CalendarEvent['priority'] }))}
                      className="block w-full border border-gray-300 rounded-lg shadow-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="low">🟢 Low</option>
                      <option value="medium">🟡 Medium</option>
                      <option value="high">🟠 High</option>
                      <option value="urgent">🔴 Urgent</option>
                    </select>
                  </div>
                  {eventMode === 'advanced' && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as CalendarEvent['status'] }))}
                        className="block w-full border border-gray-300 rounded-lg shadow-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="scheduled">📅 Scheduled</option>
                        <option value="in_progress">🔄 In Progress</option>
                        <option value="completed">✅ Completed</option>
                        <option value="cancelled">❌ Cancelled</option>
                        <option value="overdue">⏰ Overdue</option>
                      </select>
                    </div>
                  )}
                </div>

                {/* Advanced Features - Only shown in Advanced mode */}
                {eventMode === 'advanced' && (
                  <>
                    {/* Vehicle Assignment */}
                    <div className="relative">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Vehicle (Optional)</label>
                      <input
                        type="text"
                        value={vehicleSearch}
                        onChange={(e) => {
                          setVehicleSearch(e.target.value);
                          setShowVehicleDropdown(true);
                        }}
                        onFocus={() => setShowVehicleDropdown(true)}
                        className="block w-full border border-gray-300 rounded-lg shadow-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Search vehicles..."
                      />
                      {showVehicleDropdown && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
                          {filteredVehicles.map(vehicle => (
                            <div
                              key={vehicle.id}
                              onClick={() => {
                                setFormData(prev => ({ ...prev, vehicle_id: vehicle.id }));
                                setVehicleSearch(`${vehicle.make} ${vehicle.model} - ${vehicle.license_plate}`);
                                setShowVehicleDropdown(false);
                              }}
                              className="px-4 py-3 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                            >
                              <div className="font-medium text-gray-900">{vehicle.make} {vehicle.model}</div>
                              <div className="text-sm text-gray-600">{vehicle.license_plate} • {vehicle.year}</div>
                              <div className="text-xs text-gray-500">Status: {vehicle.status}</div>
                            </div>
                          ))}
                          {filteredVehicles.length === 0 && (
                            <div className="px-4 py-3 text-gray-500 text-sm">No vehicles found</div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Driver Assignment */}
                    <div className="relative">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Driver (Optional)</label>
                      <input
                        type="text"
                        value={driverSearch}
                        onChange={(e) => {
                          setDriverSearch(e.target.value);
                          setShowDriverDropdown(true);
                        }}
                        onFocus={() => setShowDriverDropdown(true)}
                        className="block w-full border border-gray-300 rounded-lg shadow-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Search drivers..."
                      />
                      {showDriverDropdown && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
                          {filteredDrivers.map(driver => (
                            <div
                              key={driver.id}
                              onClick={() => {
                                setFormData(prev => ({ ...prev, driver_id: driver.id }));
                                setDriverSearch(driver.full_name);
                                setShowDriverDropdown(false);
                              }}
                              className="px-4 py-3 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                            >
                              <div className="font-medium text-gray-900">{driver.full_name}</div>
                              <div className="text-sm text-gray-600">{driver.email}</div>
                            </div>
                          ))}
                          {filteredDrivers.length === 0 && (
                            <div className="px-4 py-3 text-gray-500 text-sm">No drivers found</div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Partner Staff Assignment */}
                    <div className="relative">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Assign To Partner Staff (Optional)</label>
                      <input
                        type="text"
                        value={staffSearch}
                        onChange={(e) => {
                          setStaffSearch(e.target.value);
                          setShowStaffDropdown(true);
                        }}
                        onFocus={() => setShowStaffDropdown(true)}
                        className="block w-full border border-gray-300 rounded-lg shadow-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Search partner staff members..."
                      />
                      {showStaffDropdown && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
                          {filteredStaff.map(staff => (
                            <div
                              key={staff.id}
                              onClick={() => {
                                setFormData(prev => ({ ...prev, assigned_to: staff.id }));
                                setStaffSearch(`${staff.full_name} (${staff.role})`);
                                setShowStaffDropdown(false);
                              }}
                              className="px-4 py-3 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                            >
                              <div className="font-medium text-gray-900">{staff.full_name}</div>
                              <div className="text-sm text-gray-600">{staff.role} • {staff.email}</div>
                            </div>
                          ))}
                          {filteredStaff.length === 0 && (
                            <div className="px-4 py-3 text-gray-500 text-sm">No partner staff members found</div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Partner Assignment */}
                    <div className="relative">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Assign To Partner (Optional)</label>
                      <input
                        type="text"
                        value={partnerSearch}
                        onChange={(e) => {
                          setPartnerSearch(e.target.value);
                          setShowPartnerDropdown(true);
                        }}
                        onFocus={() => setShowPartnerDropdown(true)}
                        className="block w-full border border-gray-300 rounded-lg shadow-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Search partners..."
                      />
                      {showPartnerDropdown && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
                          {filteredPartners.map(partner => (
                            <div
                              key={partner.id}
                              onClick={() => {
                                setFormData(prev => ({ ...prev, assigned_to: partner.id }));
                                setPartnerSearch(`${partner.company_name} (${partner.contact_name})`);
                                setShowPartnerDropdown(false);
                              }}
                              className="px-4 py-3 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                            >
                              <div className="font-medium text-gray-900">{partner.company_name}</div>
                              <div className="text-sm text-gray-600">{partner.contact_name} • {partner.email}</div>
                            </div>
                          ))}
                          {filteredPartners.length === 0 && (
                            <div className="px-4 py-3 text-gray-500 text-sm">No partners found</div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Broadcast to All Staff */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          id="selectAllStaff"
                          checked={selectAllStaff}
                          onChange={(e) => setSelectAllStaff(e.target.checked)}
                          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                        />
                        <label htmlFor="selectAllStaff" className="text-sm font-semibold text-blue-800">
                          📢 Broadcast to All Partner Staff Members
                        </label>
                        <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                          {partnerStaff.length} partner staff members
                        </span>
                      </div>
                      <p className="text-xs text-blue-600 mt-2">
                        When checked, this event will be visible to all partner staff members in your organization
                      </p>
                    </div>

                    {/* Additional Options */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Location (Optional)</label>
                        <input
                          type="text"
                          value={formData.location || ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                          className="block w-full border border-gray-300 rounded-lg shadow-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Enter location"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Meeting Link (Optional)</label>
                        <input
                          type="url"
                          value={formData.meeting_link || ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, meeting_link: e.target.value }))}
                          className="block w-full border border-gray-300 rounded-lg shadow-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="https://meet.google.com/..."
                        />
                      </div>
                    </div>

                    {/* Reminder Settings */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Reminder (Days Before)</label>
                        <input
                          type="number"
                          value={formData.reminder_days || 1}
                          onChange={(e) => setFormData(prev => ({ ...prev, reminder_days: parseInt(e.target.value) || 1 }))}
                          className="block w-full border border-gray-300 rounded-lg shadow-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          min="0"
                          max="30"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Recurring</label>
                        <select
                          value={formData.recurring || 'none'}
                          onChange={(e) => setFormData(prev => ({ ...prev, recurring: e.target.value as CalendarEvent['recurring'] }))}
                          className="block w-full border border-gray-300 rounded-lg shadow-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="none">No Recurrence</option>
                          <option value="daily">Daily</option>
                          <option value="weekly">Weekly</option>
                          <option value="monthly">Monthly</option>
                          <option value="yearly">Yearly</option>
                        </select>
                      </div>
                    </div>

                    {/* Recurring End Date */}
                    {formData.recurring && formData.recurring !== 'none' && (
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Recurring End Date</label>
                        <input
                          type="date"
                          value={formData.recurring_end_date || ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, recurring_end_date: e.target.value }))}
                          className="block w-full border border-gray-300 rounded-lg shadow-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    )}

                    {/* Team Event Checkbox */}
                    <div className="flex items-center space-x-3 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                      <input
                        type="checkbox"
                        id="team_event"
                        checked={formData.is_team_event || false}
                        onChange={(e) => setFormData(prev => ({ ...prev, is_team_event: e.target.checked }))}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                      />
                      <label htmlFor="team_event" className="text-sm font-semibold text-gray-700">
                        👥 This is a team event
                      </label>
                      <span className="text-xs text-gray-500">Team events are shared with all team members</span>
                    </div>

                    {/* Notes */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Additional Notes (Optional)</label>
                      <textarea
                        value={formData.notes || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                        className="block w-full border border-gray-300 rounded-lg shadow-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        rows={3}
                        placeholder="Enter additional notes or instructions"
                      />
                    </div>

                    {/* Assignment History & Audit Trail */}
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <h4 className="text-sm font-semibold text-gray-700 mb-3">📋 Assignment & Audit Information</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-1">Assigned By</label>
                          <div className="text-sm text-gray-900 font-medium">
                            {(user as any)?.firstName || user?.email} {(user as any)?.lastName || ''} ({user?.role})
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date().toLocaleString('en-GB', { 
                              timeZone: 'Europe/London',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-1">Assignment Type</label>
                          <select
                            value={assignmentType}
                            onChange={(e) => setAssignmentType(e.target.value)}
                            className="block w-full border border-gray-300 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                          >
                            <option value="direct">Direct Assignment</option>
                            <option value="delegated">Delegated Assignment</option>
                            <option value="escalated">Escalated Assignment</option>
                            <option value="rotational">Rotational Assignment</option>
                            <option value="emergency">Emergency Assignment</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Advanced Assignment Options */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="text-sm font-semibold text-blue-800 mb-3">🎯 Advanced Assignment Options</h4>
                      <div className="space-y-3">
                        <div className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            id="autoEscalate"
                            checked={autoEscalate}
                            onChange={(e) => setAutoEscalate(e.target.checked)}
                            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                          />
                          <label htmlFor="autoEscalate" className="text-sm font-medium text-blue-800">
                            Auto-escalate if not completed within deadline
                          </label>
                        </div>
                        <div className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            id="requireConfirmation"
                            checked={requireConfirmation}
                            onChange={(e) => setRequireConfirmation(e.target.checked)}
                            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                          />
                          <label htmlFor="requireConfirmation" className="text-sm font-medium text-blue-800">
                            Require confirmation from assignee
                          </label>
                        </div>
                        <div className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            id="sendNotifications"
                            checked={sendNotifications}
                            onChange={(e) => setSendNotifications(e.target.checked)}
                            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                          />
                          <label htmlFor="sendNotifications" className="text-sm font-medium text-blue-800">
                            Send notifications to all stakeholders
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Assignment Priority & SLA */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">SLA Deadline</label>
                        <input
                          type="datetime-local"
                          value={slaDeadline}
                          onChange={(e) => setSlaDeadline(e.target.value)}
                          className="block w-full border border-gray-300 rounded-lg shadow-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Escalation Level</label>
                        <select
                          value={escalationLevel}
                          onChange={(e) => setEscalationLevel(e.target.value)}
                          className="block w-full border border-gray-300 rounded-lg shadow-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="none">No Escalation</option>
                          <option value="supervisor">Supervisor</option>
                          <option value="manager">Manager</option>
                          <option value="director">Director</option>
                          <option value="executive">Executive</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Estimated Hours</label>
                        <input
                          type="number"
                          value={estimatedHours}
                          onChange={(e) => setEstimatedHours(e.target.value)}
                          className="block w-full border border-gray-300 rounded-lg shadow-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="0.5"
                          min="0.1"
                          step="0.1"
                        />
                      </div>
                    </div>

                    {/* Dependencies & Related Items */}
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <h4 className="text-sm font-semibold text-yellow-800 mb-3">🔗 Dependencies & Related Items</h4>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-yellow-700 mb-1">Depends On</label>
                          <input
                            type="text"
                            value={dependencies}
                            onChange={(e) => setDependencies(e.target.value)}
                            className="block w-full border border-yellow-300 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 text-sm"
                            placeholder="Event IDs separated by commas (e.g., 123, 456)"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-yellow-700 mb-1">Related Booking/Vehicle</label>
                          <input
                            type="text"
                            value={relatedItems}
                            onChange={(e) => setRelatedItems(e.target.value)}
                            className="block w-full border border-yellow-300 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 text-sm"
                            placeholder="Booking or vehicle references"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Cost & Budget Information */}
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <h4 className="text-sm font-semibold text-green-800 mb-3">💰 Cost & Budget Information</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-green-700 mb-1">Estimated Cost (£)</label>
                          <input
                            type="number"
                            value={estimatedCost}
                            onChange={(e) => setEstimatedCost(e.target.value)}
                            className="block w-full border border-green-300 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
                            placeholder="0.00"
                            min="0"
                            step="0.01"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-green-700 mb-1">Budget Category</label>
                          <select
                            value={budgetCategory}
                            onChange={(e) => setBudgetCategory(e.target.value)}
                            className="block w-full border border-green-300 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
                          >
                            <option value="">Select category</option>
                            <option value="maintenance">Vehicle Maintenance</option>
                            <option value="operations">Operations</option>
                            <option value="marketing">Marketing</option>
                            <option value="training">Training</option>
                            <option value="compliance">Compliance</option>
                            <option value="other">Other</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-green-700 mb-1">Approval Required</label>
                          <select
                            value={approvalRequired}
                            onChange={(e) => setApprovalRequired(e.target.value)}
                            className="block w-full border border-green-300 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
                          >
                            <option value="none">No Approval</option>
                            <option value="supervisor">Supervisor</option>
                            <option value="manager">Manager</option>
                            <option value="finance">Finance</option>
                            <option value="executive">Executive</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Risk Assessment */}
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <h4 className="text-sm font-semibold text-red-800 mb-3">⚠️ Risk Assessment</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-red-700 mb-1">Risk Level</label>
                          <select
                            value={riskLevel}
                            onChange={(e) => setRiskLevel(e.target.value)}
                            className="block w-full border border-red-300 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm"
                          >
                            <option value="low">🟢 Low Risk</option>
                            <option value="medium">🟡 Medium Risk</option>
                            <option value="high">🟠 High Risk</option>
                            <option value="critical">🔴 Critical Risk</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-red-700 mb-1">Mitigation Strategy</label>
                          <textarea
                            value={mitigationStrategy}
                            onChange={(e) => setMitigationStrategy(e.target.value)}
                            className="block w-full border border-red-300 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm"
                            rows={2}
                            placeholder="Describe risk mitigation strategy"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Communication Preferences */}
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                      <h4 className="text-sm font-semibold text-purple-800 mb-3">📢 Communication Preferences</h4>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            id="emailNotification"
                            checked={emailNotification}
                            onChange={(e) => setEmailNotification(e.target.checked)}
                            className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500 focus:ring-2"
                          />
                          <label htmlFor="emailNotification" className="text-sm font-medium text-purple-800">
                            Email notifications
                          </label>
                        </div>
                        <div className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            id="smsNotification"
                            checked={smsNotification}
                            onChange={(e) => setSmsNotification(e.target.checked)}
                            className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500 focus:ring-2"
                          />
                          <label htmlFor="smsNotification" className="text-sm font-medium text-purple-800">
                            SMS notifications
                          </label>
                        </div>
                        <div className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            id="inAppNotification"
                            checked={inAppNotification}
                            onChange={(e) => setInAppNotification(e.target.checked)}
                            className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500 focus:ring-2"
                          />
                          <label htmlFor="inAppNotification" className="text-sm font-medium text-purple-800">
                            In-app notifications
                          </label>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* Action Buttons */}
                <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveEvent}
                    className="inline-flex items-center px-8 py-3 border border-transparent rounded-lg text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 font-semibold shadow-lg"
                  >
                    <FaPlus className="w-4 h-4 mr-2" />
                    Create Event
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Event Details Modal */}
      {showEventModal && selectedEvent && (
        <div className="modal-overlay" onClick={() => setShowEventModal(false)}>
          <div className="modal-content w-full max-w-5xl mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6 p-6 border-b border-gray-200">
              <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Event Details
              </h3>
              <button onClick={() => setShowEventModal(false)} className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg">
                <FaTimes className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                  <h4 className="text-xl font-semibold text-gray-900 mb-4">{selectedEvent.title}</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Event Type</label>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getEventTypeColor(selectedEvent.type)}`}>
                        {eventTypes[selectedEvent.type as keyof typeof eventTypes]?.icon} {eventTypes[selectedEvent.type as keyof typeof eventTypes]?.label}
                      </span>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(selectedEvent.priority)}`}>
                        {selectedEvent.priority}
                      </span>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                      <p className="text-gray-900">{selectedEvent.description || 'No description provided'}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Start Date & Time</label>
                        <p className="text-gray-900">{new Date(selectedEvent.start_date).toLocaleString('en-GB')}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">End Date & Time</label>
                        <p className="text-gray-900">{new Date(selectedEvent.end_date).toLocaleString('en-GB')}</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Event Information</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Calendar Type</label>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getCalendarType(selectedEvent).color}`}>
                        {getCalendarType(selectedEvent).icon} {getCalendarType(selectedEvent).label}
                      </span>
                    </div>
                    {selectedEvent.location && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                        <p className="text-gray-900">{selectedEvent.location}</p>
                      </div>
                    )}
                    {selectedEvent.meeting_link && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Meeting Link</label>
                        <a href={selectedEvent.meeting_link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline">
                          Join Meeting
                        </a>
                      </div>
                    )}
                    {selectedEvent.notes && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                        <p className="text-gray-900">{selectedEvent.notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex justify-end space-x-4 mt-8 pt-6 border-t border-gray-200">
                <button
                  onClick={() => {
                    setShowEventModal(false);
                    setShowEditModal(true);
                  }}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Edit Event
                </button>
                <button
                  onClick={() => {
                    setShowEventModal(false);
                    setShowDeleteModal(true);
                  }}
                  className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Delete Event
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Date Events Modal */}
      {showDateEventsModal && expandedDate && (
        <div className="modal-overlay" onClick={() => setShowDateEventsModal(false)}>
          <div className="modal-content w-full max-w-4xl mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6 p-6 border-b border-gray-200">
              <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Events for {expandedDate.toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </h3>
              <button onClick={() => setShowDateEventsModal(false)} className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg">
                <FaTimes className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h4 className="text-lg font-semibold text-gray-900">
                  {getEventsForSpecificDate(expandedDate).length} event{getEventsForSpecificDate(expandedDate).length !== 1 ? 's' : ''} on this date
                </h4>
                <button
                  onClick={() => {
                    setShowDateEventsModal(false);
                    setShowAddModal(true);
                  }}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <FaPlus className="w-4 h-4 mr-2" />
                  Add Event
                </button>
              </div>
              
              <div className="space-y-4">
                {getEventsForSpecificDate(expandedDate).length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <FaCalendarAlt className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No events scheduled for this date</p>
                    <button
                      onClick={() => {
                        setShowDateEventsModal(false);
                        setShowAddModal(true);
                      }}
                      className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      <FaPlus className="w-4 h-4 mr-2" />
                      Add First Event
                    </button>
                  </div>
                ) : (
                  getEventsForSpecificDate(expandedDate).map((event: any) => (
                    <div key={event.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getEventTypeColor(event.type)}`}>
                              {eventTypes[event.type as keyof typeof eventTypes]?.icon} {eventTypes[event.type as keyof typeof eventTypes]?.label}
                            </span>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(event.priority)}`}>
                              {event.priority}
                            </span>
                          </div>
                          <h5 className="font-semibold text-gray-900 mb-1">{event.title}</h5>
                          <p className="text-sm text-gray-600 mb-2">{event.description}</p>
                          <div className="text-xs text-gray-500">
                            {new Date(event.start_date).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })} - {new Date(event.end_date).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setSelectedEvent(event);
                              setShowDateEventsModal(false);
                              setShowEventModal(true);
                            }}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                            title="View Details"
                          >
                            <FaEye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedEvent(event);
                              setShowDateEventsModal(false);
                              setShowEditModal(true);
                            }}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                            title="Edit Event"
                          >
                            <FaEdit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedEvent(event);
                              setShowDateEventsModal(false);
                              setShowDeleteModal(true);
                            }}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                            title="Delete Event"
                          >
                            <FaTrash className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Event Modal */}
      {showEditModal && selectedEvent && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content w-full max-w-6xl mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6 p-6 border-b border-gray-200">
              <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Edit Event
              </h3>
              <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg">
                <FaTimes className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6">
              <div className="space-y-6">
                {/* Event History & Audit Trail */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">📋 Event History & Audit Trail</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Created By</label>
                      <div className="text-sm text-gray-900 font-medium">
                        {selectedEvent.created_by_name || 'Unknown User'}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(selectedEvent.created_at).toLocaleString('en-GB', { 
                          timeZone: 'Europe/London',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Last Modified</label>
                      <div className="text-sm text-gray-900 font-medium">
                        {new Date(selectedEvent.updated_at).toLocaleString('en-GB', { 
                          timeZone: 'Europe/London',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Current Status</label>
                      <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        selectedEvent.status === 'completed' ? 'bg-green-100 text-green-800' :
                        selectedEvent.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                        selectedEvent.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                        selectedEvent.status === 'overdue' ? 'bg-orange-100 text-orange-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {selectedEvent.status.replace('_', ' ').toUpperCase()}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Event Title *</label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      className="block w-full border border-gray-300 rounded-lg shadow-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter event title"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Event Type *</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as CalendarEvent['type'] }))}
                      className="block w-full border border-gray-300 rounded-lg shadow-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      <option value="">Select event type</option>
                      <optgroup label="🚗 Vehicle Events">
                        <option value="vehicle_pickup">🚗 Vehicle Pickup</option>
                        <option value="vehicle_return">🚗 Vehicle Return</option>
                        <option value="scheduled_maintenance">🔧 Scheduled Maintenance</option>
                        <option value="emergency_repair">🚨 Emergency Repair</option>
                        <option value="oil_change">🛢️ Oil Change</option>
                        <option value="tire_replacement">🛞 Tire Replacement</option>
                        <option value="brake_service">🛑 Brake Service</option>
                      </optgroup>
                      <optgroup label="📋 Administrative">
                        <option value="pco_renewal">📋 PCO Renewal</option>
                        <option value="insurance_renewal">🛡️ Insurance Renewal</option>
                        <option value="mot_test">🔍 MOT Test</option>
                        <option value="document_expiry">📄 Document Expiry</option>
                        <option value="compliance_check">✅ Compliance Check</option>
                      </optgroup>
                      <optgroup label="💰 Financial">
                        <option value="payment_due">💰 Payment Due</option>
                        <option value="commission_payment">💸 Commission Payment</option>
                        <option value="invoice_generation">🧾 Invoice Generation</option>
                        <option value="tax_filing">📊 Tax Filing</option>
                        <option value="budget_review">📈 Budget Review</option>
                      </optgroup>
                      <optgroup label="👥 Team & Staff">
                        <option value="team_meeting">👥 Team Meeting</option>
                        <option value="staff_assignment">👨‍💼 Staff Assignment</option>
                        <option value="partner_assignment">🤝 Partner Assignment</option>
                        <option value="training_session">🎓 Training Session</option>
                        <option value="performance_review">📊 Performance Review</option>
                      </optgroup>
                      <optgroup label="📅 Other">
                        <option value="booking_extension">📅 Booking Extension</option>
                        <option value="early_return">⏰ Early Return</option>
                        <option value="late_return">⏰ Late Return</option>
                        <option value="custom">📝 Custom Event</option>
                      </optgroup>
                    </select>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="block w-full border border-gray-300 rounded-lg shadow-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                    placeholder="Enter detailed event description"
                  />
                </div>

                {/* Date & Time */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Start Date & Time *</label>
                    <input
                      type="datetime-local"
                      value={formData.start_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                      className="block w-full border border-gray-300 rounded-lg shadow-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">End Date & Time *</label>
                    <input
                      type="datetime-local"
                      value={formData.end_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                      className="block w-full border border-gray-300 rounded-lg shadow-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                </div>

                {/* Priority & Status */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Priority</label>
                    <select
                      value={formData.priority}
                      onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as CalendarEvent['priority'] }))}
                      className="block w-full border border-gray-300 rounded-lg shadow-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="low">🟢 Low</option>
                      <option value="medium">🟡 Medium</option>
                      <option value="high">🟠 High</option>
                      <option value="urgent">🔴 Urgent</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as CalendarEvent['status'] }))}
                      className="block w-full border border-gray-300 rounded-lg shadow-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="scheduled">📅 Scheduled</option>
                      <option value="in_progress">🔄 In Progress</option>
                      <option value="completed">✅ Completed</option>
                      <option value="cancelled">❌ Cancelled</option>
                      <option value="overdue">⏰ Overdue</option>
                    </select>
                  </div>
                </div>

                {/* Vehicle Assignment */}
                <div className="relative">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Vehicle (Optional)</label>
                  <input
                    type="text"
                    value={vehicleSearch}
                    onChange={(e) => {
                      setVehicleSearch(e.target.value);
                      setShowVehicleDropdown(true);
                    }}
                    onFocus={() => setShowVehicleDropdown(true)}
                    className="block w-full border border-gray-300 rounded-lg shadow-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Search vehicles..."
                  />
                  {showVehicleDropdown && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
                      {filteredVehicles.map(vehicle => (
                        <div
                          key={vehicle.id}
                          onClick={() => {
                            setFormData(prev => ({ ...prev, vehicle_id: vehicle.id }));
                            setVehicleSearch(`${vehicle.make} ${vehicle.model} - ${vehicle.license_plate}`);
                            setShowVehicleDropdown(false);
                          }}
                          className="px-4 py-3 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                        >
                          <div className="font-medium text-gray-900">{vehicle.make} {vehicle.model}</div>
                          <div className="text-sm text-gray-600">{vehicle.license_plate} • {vehicle.year}</div>
                          <div className="text-xs text-gray-500">Status: {vehicle.status}</div>
                        </div>
                      ))}
                      {filteredVehicles.length === 0 && (
                        <div className="px-4 py-3 text-gray-500 text-sm">No vehicles found</div>
                      )}
                    </div>
                  )}
                </div>

                {/* Driver Assignment */}
                <div className="relative">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Driver (Optional)</label>
                  <input
                    type="text"
                    value={driverSearch}
                    onChange={(e) => {
                      setDriverSearch(e.target.value);
                      setShowDriverDropdown(true);
                    }}
                    onFocus={() => setShowDriverDropdown(true)}
                    className="block w-full border border-gray-300 rounded-lg shadow-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Search drivers..."
                  />
                  {showDriverDropdown && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
                      {filteredDrivers.map(driver => (
                        <div
                          key={driver.id}
                          onClick={() => {
                            setFormData(prev => ({ ...prev, driver_id: driver.id }));
                            setDriverSearch(driver.full_name);
                            setShowDriverDropdown(false);
                          }}
                          className="px-4 py-3 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                        >
                          <div className="font-medium text-gray-900">{driver.full_name}</div>
                          <div className="text-sm text-gray-600">{driver.email}</div>
                        </div>
                      ))}
                      {filteredDrivers.length === 0 && (
                        <div className="px-4 py-3 text-gray-500 text-sm">No drivers found</div>
                      )}
                    </div>
                  )}
                </div>

                {/* Partner Staff Assignment */}
                <div className="relative">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Assign To Partner Staff (Optional)</label>
                  <input
                    type="text"
                    value={staffSearch}
                    onChange={(e) => {
                      setStaffSearch(e.target.value);
                      setShowStaffDropdown(true);
                    }}
                    onFocus={() => setShowStaffDropdown(true)}
                    className="block w-full border border-gray-300 rounded-lg shadow-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Search partner staff members..."
                  />
                  {showStaffDropdown && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
                      {filteredStaff.map(staff => (
                        <div
                          key={staff.id}
                          onClick={() => {
                            setFormData(prev => ({ ...prev, assigned_to: staff.id }));
                            setStaffSearch(`${staff.full_name} (${staff.role})`);
                            setShowStaffDropdown(false);
                          }}
                          className="px-4 py-3 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                        >
                          <div className="font-medium text-gray-900">{staff.full_name}</div>
                          <div className="text-sm text-gray-600">{staff.role} • {staff.email}</div>
                        </div>
                      ))}
                      {filteredStaff.length === 0 && (
                        <div className="px-4 py-3 text-gray-500 text-sm">No partner staff members found</div>
                      )}
                    </div>
                  )}
                </div>

                {/* Partner Assignment */}
                <div className="relative">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Assign To Partner (Optional)</label>
                  <input
                    type="text"
                    value={partnerSearch}
                    onChange={(e) => {
                      setPartnerSearch(e.target.value);
                      setShowPartnerDropdown(true);
                    }}
                    onFocus={() => setShowPartnerDropdown(true)}
                    className="block w-full border border-gray-300 rounded-lg shadow-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Search partners..."
                  />
                  {showPartnerDropdown && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
                      {filteredPartners.map(partner => (
                        <div
                          key={partner.id}
                          onClick={() => {
                            setFormData(prev => ({ ...prev, assigned_to: partner.id }));
                            setPartnerSearch(`${partner.company_name} (${partner.contact_name})`);
                            setShowPartnerDropdown(false);
                          }}
                          className="px-4 py-3 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                        >
                          <div className="font-medium text-gray-900">{partner.company_name}</div>
                          <div className="text-sm text-gray-600">{partner.contact_name} • {partner.email}</div>
                        </div>
                      ))}
                      {filteredPartners.length === 0 && (
                        <div className="px-4 py-3 text-gray-500 text-sm">No partners found</div>
                      )}
                    </div>
                  )}
                </div>

                {/* Broadcast to All Staff */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="selectAllStaffEdit"
                      checked={selectAllStaff}
                      onChange={(e) => setSelectAllStaff(e.target.checked)}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                    />
                    <label htmlFor="selectAllStaffEdit" className="text-sm font-semibold text-blue-800">
                      📢 Broadcast to All Partner Staff Members
                    </label>
                    <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                      {partnerStaff.length} partner staff members
                    </span>
                  </div>
                  <p className="text-xs text-blue-600 mt-2">
                    When checked, this event will be visible to all partner staff members in your organization
                  </p>
                </div>

                {/* Additional Options */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Location (Optional)</label>
                    <input
                      type="text"
                      value={formData.location || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                      className="block w-full border border-gray-300 rounded-lg shadow-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter location"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Meeting Link (Optional)</label>
                    <input
                      type="url"
                      value={formData.meeting_link || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, meeting_link: e.target.value }))}
                      className="block w-full border border-gray-300 rounded-lg shadow-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="https://meet.google.com/..."
                    />
                  </div>
                </div>

                {/* Reminder Settings */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Reminder (Days Before)</label>
                    <input
                      type="number"
                      value={formData.reminder_days || 1}
                      onChange={(e) => setFormData(prev => ({ ...prev, reminder_days: parseInt(e.target.value) || 1 }))}
                      className="block w-full border border-gray-300 rounded-lg shadow-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      min="0"
                      max="30"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Recurring</label>
                    <select
                      value={formData.recurring || 'none'}
                      onChange={(e) => setFormData(prev => ({ ...prev, recurring: e.target.value as CalendarEvent['recurring'] }))}
                      className="block w-full border border-gray-300 rounded-lg shadow-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="none">No Recurrence</option>
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                      <option value="yearly">Yearly</option>
                    </select>
                  </div>
                </div>

                {/* Recurring End Date */}
                {formData.recurring && formData.recurring !== 'none' && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Recurring End Date</label>
                    <input
                      type="date"
                      value={formData.recurring_end_date || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, recurring_end_date: e.target.value }))}
                      className="block w-full border border-gray-300 rounded-lg shadow-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                )}

                {/* Team Event Checkbox */}
                <div className="flex items-center space-x-3 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <input
                    type="checkbox"
                    id="team_event_edit"
                    checked={formData.is_team_event || false}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_team_event: e.target.checked }))}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                  />
                  <label htmlFor="team_event_edit" className="text-sm font-semibold text-gray-700">
                    👥 This is a team event
                  </label>
                  <span className="text-xs text-gray-500">Team events are shared with all team members</span>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Additional Notes (Optional)</label>
                  <textarea
                    value={formData.notes || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    className="block w-full border border-gray-300 rounded-lg shadow-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                    placeholder="Enter additional notes or instructions"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                  <button
                    onClick={() => setShowEditModal(false)}
                    className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveEvent}
                    className="inline-flex items-center px-8 py-3 border border-transparent rounded-lg text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 font-semibold shadow-lg"
                  >
                    <FaSave className="w-4 h-4 mr-2" />
                    Update Event
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Event Modal */}
      {showDeleteModal && selectedEvent && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-content w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6 p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">Delete Event</h3>
              <button onClick={() => setShowDeleteModal(false)} className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg">
                <FaTimes className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <div className="text-center">
                <FaExclamationTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h4 className="text-lg font-semibold text-gray-900 mb-2">Are you sure?</h4>
                <p className="text-gray-600 mb-6">
                  You are about to delete the event "{selectedEvent.title}". This action cannot be undone.
                </p>
                <div className="flex justify-center space-x-4">
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={deleteEvent}
                    className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    Delete Event
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 