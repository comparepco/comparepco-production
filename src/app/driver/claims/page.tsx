'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../lib/supabase/client';
import { 
  FaCarCrash, 
  FaCheckCircle, 
  FaExclamationTriangle, 
  FaSearch, 
  FaUser, 
  FaCar, 
  FaListAlt,
  FaPlus, 
  FaEdit, 
  FaTrash, 
  FaFilter, 
  FaDownload, 
  FaUpload, 
  FaFileAlt, 
  FaShieldAlt,
  FaCalendarAlt, 
  FaClock, 
  FaMapMarkerAlt, 
  FaTools, 
  FaBan, 
  FaPlay, 
  FaStop, 
  FaEllipsisH,
  FaThumbsUp, 
  FaThumbsDown, 
  FaComment, 
  FaPaperclip, 
  FaSave, 
  FaTimes, 
  FaEye, 
  FaCog,
  FaPhone,
  FaEnvelope,
  FaCamera,
  FaFileUpload,
  FaCheck,
  FaTimes as FaX,
  FaInfoCircle,
  FaExclamationTriangle as FaWarning,
  FaCheckDouble,
  FaChevronRight
} from 'react-icons/fa';

interface Claim {
  id: string;
  driver_id: string;
  partner_id?: string;
  booking_id?: string;
  car_id?: string;
  status: 'open' | 'need_info' | 'closed' | 'resolved' | 'rejected';
  severity: 'low' | 'medium' | 'high' | 'urgent';
  type: 'accident' | 'damage' | 'theft' | 'mechanical' | 'insurance' | 'other';
  title: string;
  description: string;
  amount?: number;
  evidence?: string[];
  partner_response?: string;
  driver_response?: string;
  created_at: string;
  updated_at: string;
  incident_date?: string;
  location?: string;
  witnesses?: string;
  police_report?: string;
  insurance_claim_number?: string;
}

interface Booking {
  id: string;
  car_name?: string;
  car_info?: {
    make?: string;
    model?: string;
    registration_number?: string;
  };
  start_date?: string;
  end_date?: string;
  status: string;
  partner_name?: string;
}

interface Vehicle {
  id: string;
  name?: string;
  make?: string;
  model?: string;
  registration_number?: string;
  partner_name?: string;
}

export default function DriverClaimsPage() {
  const { user } = useAuth();
  const [claims, setClaims] = useState<Claim[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // UI States
  const [showNewClaimForm, setShowNewClaimForm] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);
  const [showClaimDetail, setShowClaimDetail] = useState(false);
  const [showResponseForm, setShowResponseForm] = useState(false);
  
  // Filter states
  const [statusFilter, setStatusFilter] = useState<'all' | Claim['status']>('all');
  const [severityFilter, setSeverityFilter] = useState<'all' | Claim['severity']>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | Claim['type']>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Form states for new claim
  const [newClaim, setNewClaim] = useState({
    type: 'accident' as Claim['type'],
    title: '',
    description: '',
    severity: 'medium' as Claim['severity'],
    booking_id: '',
    incident_date: '',
    location: '',
    witnesses: '',
    police_report: '',
    insurance_claim_number: '',
    evidence: [] as string[]
  });

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Fetch driver's claims
      const { data: claimsData, error: claimsError } = await supabase
        .from('claims')
        .select('*')
        .eq('driver_id', user.id)
        .order('created_at', { ascending: false });

      if (claimsError) {
        console.error('Error fetching claims:', claimsError);
        setError('Failed to load claims');
        return;
      }

      setClaims(claimsData || []);

      // Fetch driver's bookings
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select(`
          *,
          car:cars(make, model, registration_number),
          partner:partners(company_name)
        `)
        .eq('driver_id', user.id)
        .order('created_at', { ascending: false });

      if (!bookingsError && bookingsData) {
        const processedBookings = bookingsData.map((booking: any) => ({
          id: booking.id,
          car_name: booking.car?.make && booking.car?.model 
            ? `${booking.car.make} ${booking.car.model}` 
            : 'Vehicle',
          car_info: booking.car,
          start_date: booking.start_date,
          end_date: booking.end_date,
          status: booking.status,
          partner_name: booking.partner?.company_name
        }));
        setBookings(processedBookings);
      }

      // Fetch vehicles from bookings
      const vehicleIds = Array.from(new Set(bookingsData?.map((b: any) => b.car_id).filter(Boolean) || []));
      if (vehicleIds.length > 0) {
        const { data: vehiclesData, error: vehiclesError } = await supabase
          .from('cars')
          .select(`
            *,
            partner:partners(company_name)
          `)
          .in('id', vehicleIds);

        if (!vehiclesError && vehiclesData) {
          const processedVehicles = vehiclesData.map((vehicle: any) => ({
            id: vehicle.id,
            name: vehicle.name,
            make: vehicle.make,
            model: vehicle.model,
            registration_number: vehicle.registration_number,
            partner_name: vehicle.partner?.company_name
          }));
          setVehicles(processedVehicles);
        }
      }

    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const createClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!newClaim.title.trim() || !newClaim.description.trim()) {
      setError('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    try {
             const claimData = {
         driver_id: user.id,
         booking_id: newClaim.booking_id || null,
         car_id: null, // Will be set from booking data if available
         partner_id: null, // Will be set from booking data if available
         type: newClaim.type,
         title: newClaim.title.trim(),
         description: newClaim.description.trim(),
         severity: newClaim.severity,
         status: 'open',
         incident_date: newClaim.incident_date || null,
         location: newClaim.location || null,
         witnesses: newClaim.witnesses || null,
         police_report: newClaim.police_report || null,
         insurance_claim_number: newClaim.insurance_claim_number || null,
         evidence: newClaim.evidence,
         created_at: new Date().toISOString(),
         updated_at: new Date().toISOString()
       };

      const { error } = await supabase
        .from('claims')
        .insert([claimData]);

      if (error) {
        console.error('Error creating claim:', error);
        setError('Failed to submit claim');
        return;
      }

      // Reset form and refresh data
      setNewClaim({
        type: 'accident',
        title: '',
        description: '',
        severity: 'medium',
        booking_id: '',
        incident_date: '',
        location: '',
        witnesses: '',
        police_report: '',
        insurance_claim_number: '',
        evidence: []
      });
      setShowNewClaimForm(false);
      fetchData();
      setError('');
    } catch (err) {
      console.error('Error creating claim:', err);
      setError('Failed to submit claim');
    } finally {
      setSubmitting(false);
    }
  };

  const updateClaimStatus = async (claimId: string, status: Claim['status']) => {
    try {
      const { error } = await supabase
        .from('claims')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', claimId);

      if (error) {
        console.error('Error updating claim:', error);
        return;
      }

      setClaims(prev => prev.map(c => 
        c.id === claimId ? { ...c, status, updated_at: new Date().toISOString() } : c
      ));
    } catch (err) {
      console.error('Error updating claim status:', err);
    }
  };

  const addClaimResponse = async (claimId: string, response: string) => {
    try {
      const { error } = await supabase
        .from('claims')
        .update({ 
          driver_response: response,
          updated_at: new Date().toISOString()
        })
        .eq('id', claimId);

      if (error) {
        console.error('Error adding response:', error);
        return;
      }

      setClaims(prev => prev.map(c => 
        c.id === claimId ? { ...c, driver_response: response, updated_at: new Date().toISOString() } : c
      ));
      setShowResponseForm(false);
    } catch (err) {
      console.error('Error adding response:', err);
    }
  };

  const getStatusColor = (status: Claim['status']) => {
    switch (status) {
      case 'open': return 'bg-blue-100 text-blue-800';
      case 'need_info': return 'bg-yellow-100 text-yellow-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSeverityColor = (severity: Claim['severity']) => {
    switch (severity) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: Claim['type']) => {
    switch (type) {
      case 'accident': return <FaCarCrash className="text-red-500" />;
      case 'damage': return <FaTools className="text-orange-500" />;
      case 'theft': return <FaBan className="text-red-600" />;
      case 'mechanical': return <FaCog className="text-blue-500" />;
      case 'insurance': return <FaShieldAlt className="text-green-500" />;
      default: return <FaFileAlt className="text-gray-500" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredClaims = useMemo(() => {
    return claims.filter(claim => {
      const statusMatch = statusFilter === 'all' || claim.status === statusFilter;
      const severityMatch = severityFilter === 'all' || claim.severity === severityFilter;
      const typeMatch = typeFilter === 'all' || claim.type === typeFilter;
      const searchMatch = !searchTerm || 
        claim.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        claim.description.toLowerCase().includes(searchTerm.toLowerCase());

      return statusMatch && severityMatch && typeMatch && searchMatch;
    });
  }, [claims, statusFilter, severityFilter, typeFilter, searchTerm]);

  const stats = {
    total: claims.length,
    open: claims.filter(c => c.status === 'open').length,
    needInfo: claims.filter(c => c.status === 'need_info').length,
    resolved: claims.filter(c => c.status === 'resolved').length,
    urgent: claims.filter(c => c.severity === 'urgent').length
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <div className="text-xl font-semibold text-gray-600">Loading claims...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Claims Management</h1>
              <p className="text-gray-600 mt-2">
                Report incidents, track claims, and communicate with partners
              </p>
            </div>
            <button
              onClick={() => setShowNewClaimForm(true)}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <FaPlus className="w-4 h-4" />
              New Claim
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FaFileAlt className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Claims</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FaExclamationTriangle className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Open</p>
                <p className="text-2xl font-bold text-gray-900">{stats.open}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <FaInfoCircle className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Need Info</p>
                <p className="text-2xl font-bold text-gray-900">{stats.needInfo}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <FaCheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Resolved</p>
                <p className="text-2xl font-bold text-gray-900">{stats.resolved}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <FaWarning className="w-6 h-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Urgent</p>
                <p className="text-2xl font-bold text-gray-900">{stats.urgent}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow mb-6 p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search claims..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="open">Open</option>
                <option value="need_info">Need Info</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Severity</label>
              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Severity</option>
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Types</option>
                <option value="accident">Accident</option>
                <option value="damage">Damage</option>
                <option value="theft">Theft</option>
                <option value="mechanical">Mechanical</option>
                <option value="insurance">Insurance</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
        </div>

        {/* Claims List */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Claims ({filteredClaims.length})
            </h2>
          </div>
          
          {filteredClaims.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <FaFileAlt className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No claims found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || statusFilter !== 'all' || severityFilter !== 'all' || typeFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Get started by creating your first claim'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredClaims.map(claim => (
                <div
                  key={claim.id}
                  className="px-6 py-4 hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => {
                    setSelectedClaim(claim);
                    setShowClaimDetail(true);
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 mt-1">
                        {getTypeIcon(claim.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-medium text-gray-900">{claim.title}</h3>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(claim.status)}`}>
                            {claim.status.replace('_', ' ')}
                          </span>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(claim.severity)}`}>
                            {claim.severity}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                          {claim.description}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>Created: {formatDate(claim.created_at)}</span>
                          {claim.incident_date && (
                            <span>Incident: {formatDate(claim.incident_date)}</span>
                          )}
                          {claim.location && (
                            <span>Location: {claim.location}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {claim.partner_response && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          <FaComment className="w-3 h-3 mr-1" />
                          Response
                        </span>
                      )}
                      <FaChevronRight className="w-4 h-4 text-gray-400" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <FaExclamationTriangle className="flex-shrink-0 h-5 w-5 text-red-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* New Claim Form Modal */}
      {showNewClaimForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Submit New Claim</h2>
                <button
                  onClick={() => setShowNewClaimForm(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FaTimes className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <form onSubmit={createClaim} className="px-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Claim Type</label>
                  <select
                    value={newClaim.type}
                    onChange={(e) => setNewClaim(prev => ({ ...prev, type: e.target.value as Claim['type'] }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="accident">Accident</option>
                    <option value="damage">Damage</option>
                    <option value="theft">Theft</option>
                    <option value="mechanical">Mechanical</option>
                    <option value="insurance">Insurance</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Severity</label>
                  <select
                    value={newClaim.severity}
                    onChange={(e) => setNewClaim(prev => ({ ...prev, severity: e.target.value as Claim['severity'] }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Related Booking (Optional)</label>
                <select
                  value={newClaim.booking_id}
                  onChange={(e) => setNewClaim(prev => ({ ...prev, booking_id: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select a booking</option>
                  {bookings.map(booking => (
                    <option key={booking.id} value={booking.id}>
                      {booking.car_name} - {booking.partner_name} - {formatDate(booking.start_date || '')}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                <input
                  type="text"
                  value={newClaim.title}
                  onChange={(e) => setNewClaim(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Brief description of the claim"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={newClaim.description}
                  onChange={(e) => setNewClaim(prev => ({ ...prev, description: e.target.value }))}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Detailed description of the incident..."
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Incident Date</label>
                  <input
                    type="datetime-local"
                    value={newClaim.incident_date}
                    onChange={(e) => setNewClaim(prev => ({ ...prev, incident_date: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                  <input
                    type="text"
                    value={newClaim.location}
                    onChange={(e) => setNewClaim(prev => ({ ...prev, location: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Where did it happen?"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Witnesses</label>
                  <input
                    type="text"
                    value={newClaim.witnesses}
                    onChange={(e) => setNewClaim(prev => ({ ...prev, witnesses: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Names of witnesses (if any)"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Police Report Number</label>
                  <input
                    type="text"
                    value={newClaim.police_report}
                    onChange={(e) => setNewClaim(prev => ({ ...prev, police_report: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Police report number (if applicable)"
                  />
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Insurance Claim Number</label>
                <input
                  type="text"
                  value={newClaim.insurance_claim_number}
                  onChange={(e) => setNewClaim(prev => ({ ...prev, insurance_claim_number: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Insurance claim number (if applicable)"
                />
              </div>

              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowNewClaimForm(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Submit Claim'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Claim Detail Modal */}
      {showClaimDetail && selectedClaim && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Claim Details</h2>
                <button
                  onClick={() => setShowClaimDetail(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FaTimes className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="px-6 py-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Claim Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Claim Information</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Title</label>
                      <p className="text-sm text-gray-900 mt-1">{selectedClaim.title}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Description</label>
                      <p className="text-sm text-gray-900 mt-1">{selectedClaim.description}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Status</label>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mt-1 ${getStatusColor(selectedClaim.status)}`}>
                          {selectedClaim.status.replace('_', ' ')}
                        </span>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Severity</label>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mt-1 ${getSeverityColor(selectedClaim.severity)}`}>
                          {selectedClaim.severity}
                        </span>
                      </div>
                    </div>
                    {selectedClaim.incident_date && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Incident Date</label>
                        <p className="text-sm text-gray-900 mt-1">{formatDate(selectedClaim.incident_date)}</p>
                      </div>
                    )}
                    {selectedClaim.location && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Location</label>
                        <p className="text-sm text-gray-900 mt-1">{selectedClaim.location}</p>
                      </div>
                    )}
                    {selectedClaim.witnesses && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Witnesses</label>
                        <p className="text-sm text-gray-900 mt-1">{selectedClaim.witnesses}</p>
                      </div>
                    )}
                    {selectedClaim.police_report && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Police Report</label>
                        <p className="text-sm text-gray-900 mt-1">{selectedClaim.police_report}</p>
                      </div>
                    )}
                    {selectedClaim.insurance_claim_number && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Insurance Claim</label>
                        <p className="text-sm text-gray-900 mt-1">{selectedClaim.insurance_claim_number}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Communication */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Communication</h3>
                  <div className="space-y-4">
                    {selectedClaim.partner_response && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Partner Response</label>
                        <div className="mt-2 p-3 bg-blue-50 rounded-lg">
                          <p className="text-sm text-gray-900">{selectedClaim.partner_response}</p>
                        </div>
                      </div>
                    )}
                    
                    {selectedClaim.driver_response && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Your Response</label>
                        <div className="mt-2 p-3 bg-green-50 rounded-lg">
                          <p className="text-sm text-gray-900">{selectedClaim.driver_response}</p>
                        </div>
                      </div>
                    )}

                    {selectedClaim.status === 'need_info' && !selectedClaim.driver_response && (
                      <div>
                        <button
                          onClick={() => setShowResponseForm(true)}
                          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Add Response
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Evidence */}
              {selectedClaim.evidence && selectedClaim.evidence.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Evidence</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {selectedClaim.evidence.map((evidence, index) => (
                      <div key={index} className="bg-gray-100 rounded-lg p-4">
                        <FaFileUpload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-xs text-gray-600 text-center">Evidence {index + 1}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-6 flex items-center justify-end gap-3">
                <button
                  onClick={() => setShowClaimDetail(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Response Form Modal */}
      {showResponseForm && selectedClaim && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Add Response</h2>
            </div>
            
            <div className="px-6 py-4">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Your Response</label>
                <textarea
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Provide additional information or respond to the partner's request..."
                  id="response-text"
                />
              </div>

              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => setShowResponseForm(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    const response = (document.getElementById('response-text') as HTMLTextAreaElement).value;
                    if (response.trim()) {
                      addClaimResponse(selectedClaim.id, response);
                    }
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Submit Response
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 