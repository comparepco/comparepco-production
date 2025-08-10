'use client';
export const dynamic = 'force-dynamic';

import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase/client';
const sb: any = supabase;
// TODO: Re-implement ClaimForm and ClaimDetailDrawer with Supabase
// import ClaimForm from '../../../components/ClaimForm';
// import ClaimDetailDrawer from '@/components/ClaimDetailDrawer';

import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/solid';
import { 
  FaCarCrash, FaCheckCircle, FaExclamationTriangle, FaSearch, FaUser, FaCar, FaListAlt,
  FaPlus, FaEdit, FaTrash, FaFilter, FaDownload, FaUpload, FaFileAlt, FaShieldAlt,
  FaCalendarAlt, FaClock, FaMapMarkerAlt, FaTools, FaBan, FaPlay, FaStop, FaEllipsisH,
  FaThumbsUp, FaThumbsDown, FaComment, FaPaperclip, FaSave, FaTimes, FaEye, FaCog
} from 'react-icons/fa';
import { useRouter } from 'next/navigation';

type ClaimDoc = {
  id: string;
  createdAt: string | Date;
  status: 'open' | 'need_info' | 'closed';
  severity?: 'low' | 'medium' | 'high';
  description?: string;
  bookingId?: string;
  carId?: string;
  driverId?: string;
};

const STATUS_OPTIONS: { value: ClaimDoc['status'] | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'open', label: 'Open' },
  { value: 'need_info', label: 'Need Info' },
  { value: 'closed', label: 'Closed' }
];

const SEVERITY_OPTIONS: { value: NonNullable<ClaimDoc['severity']> | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' }
];

function StatusBadge({ status }: { status: ClaimDoc['status'] }) {
  const map: Record<ClaimDoc['status'], string> = {
    open: 'bg-amber-100 text-amber-800',
    need_info: 'bg-red-100 text-red-800',
    closed: 'bg-green-100 text-green-800'
  } as const;
  return <span className={`px-2 py-1 text-xs font-semibold rounded-full capitalize ${map[status]}`}>{status.replace('_',' ')}</span>;
}

function SeverityBadge({ severity }: { severity?: ClaimDoc['severity'] }) {
  if (!severity) return null;
  const map: Record<NonNullable<ClaimDoc['severity']>, string> = {
    low: 'bg-gray-100 text-gray-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-red-100 text-red-800'
  } as const;
  return <span className={`px-2 py-1 text-xs font-semibold rounded-full capitalize ${map[severity]}`}>{severity}</span>;
}

// ---------------- Enhanced Claim Detail Drawer ----------------
function ClaimDetailDrawer({ claimId, onClose, onUpdated }: { claimId: string; onClose: () => void; onUpdated: () => void }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [claim, setClaim] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'details' | 'timeline' | 'attachments'>('details');
  const [editing, setEditing] = useState(false);
  const [comments,setComments]=useState<any[]>([]);
  const [attachments,setAttachments]=useState<any[]>([]);
  const [newNote,setNewNote]=useState('');
  const fetchExtras = async ()=>{
     const {data:cmts}=await sb.from('claim_comments').select('*').eq('claim_id',claimId).order('created_at',{ascending:false});
     if(cmts) setComments(cmts);
     const {data:atts}=await sb.from('claim_attachments').select('*').eq('claim_id',claimId).order('created_at',{ascending:false});
     if(atts) setAttachments(atts);
  };
  useEffect(()=>{fetchExtras();},[claimId]);

  const addComment=async()=>{
     if(!newNote.trim()) return;
     const {error}=await sb.from('claim_comments').insert([{claim_id:claimId,note:newNote.trim(),user_id:user?.id}]);
     if(!error){setNewNote('');fetchExtras(); toast({title:'Note added'});} else {toast({title:'Error',description:error.message});}
  };

  const handleFile= async (e:React.ChangeEvent<HTMLInputElement>)=>{
     const file=e.target.files?.[0];
     if(!file) return;
     const path=`${claimId}/${Date.now()}_${file.name}`;
     const {error:uploadErr}=await supabase.storage.from('claim-attachments').upload(path,file);
     if(uploadErr){toast({title:'Upload error',description:uploadErr.message});return;}
     const url=`${supabase.storage.from('claim-attachments').getPublicUrl(path).data.publicUrl}`;
     const {error}=await sb.from('claim_attachments').insert([{claim_id:claimId,user_id:user?.id,file_name:file.name,file_url:url}]);
     if(!error){fetchExtras();toast({title:'File uploaded'});} else {toast({title:'DB error',description:error.message});}
  };

  const handleStatusChange = async (newStatus: 'open' | 'need_info' | 'closed') => {
    const { error } = await sb
      .from('claims')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', claimId);
    if (!error) {
      setClaim((prev:any)=>({...prev,status:newStatus,updated_at:new Date().toISOString()}));
      toast({ title: 'Claim updated', description: `Status changed to ${newStatus}` });
      onUpdated();
    } else {
      toast({ title: 'Error', description: error.message });
    }
  };

  const toggleEdit = () => setEditing(!editing);

  useEffect(() => {
    const fetchDetail = async () => {
      setLoading(true);
      const { data, error } = await sb
        .from('claims')
        .select('*')
        .eq('id', claimId)
        .single();
      if (!error) setClaim(data);
      setLoading(false);
    };
    fetchDetail();
  }, [claimId]);

  if (!claim) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        className="flex-1 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Enhanced Drawer */}
      <div className="w-full sm:w-[500px] bg-white shadow-xl h-full overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Claim Details</h2>
              <p className="text-sm text-gray-500">ID: {claimId}</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={toggleEdit} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                <FaEdit className="w-4 h-4" />
              </button>
              <button onClick={onClose} className="p-2 text-gray-400 hover:text-red-500 rounded-lg hover:bg-gray-100">
                <FaTimes className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
          </div>
        ) : (
          <div className="p-6">
            {/* Status Banner */}
            <div className="mb-6 p-4 rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <StatusBadge status={claim.status} />
                  <SeverityBadge severity={claim.severity} />
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Created</p>
                  <p className="font-semibold text-gray-900">{new Date(claim.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 mb-6">
              {[
                { id: 'details', label: 'Details', icon: FaFileAlt },
                { id: 'timeline', label: 'Timeline', icon: FaClock },
                { id: 'attachments', label: 'Attachments', icon: FaPaperclip }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            {activeTab === 'details' && (
              <div className="space-y-6">
                {editing && (
                  <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg space-y-3">
                    <p className="font-semibold text-blue-700">Edit Description</p>
                    <textarea
                      defaultValue={claim.description || ''}
                      rows={4}
                      className="w-full border border-gray-300 rounded-lg p-2 text-black"
                      onBlur={async (e)=>{
                        const val = e.target.value.trim();
                        if(val!==claim.description){
                          const {error}=await sb.from('claims').update({description:val,updated_at:new Date().toISOString()}).eq('id',claimId);
                          if(!error){ setClaim((prev:any)=>({...prev,description:val,updated_at:new Date().toISOString()})); toast({title:'Updated',description:'Description saved'}); onUpdated();} else {toast({title:'Error',description:error.message});}
                        }
                      }}
                    />
                    <p className="text-xs text-gray-500">Click outside the box to save.</p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm font-medium text-gray-600 mb-1">Booking ID</p>
                    <p className="font-semibold text-gray-900">{claim.booking_id || '—'}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm font-medium text-gray-600 mb-1">Vehicle ID</p>
                    <p className="font-semibold text-gray-900">{claim.car_id || '—'}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm font-medium text-gray-600 mb-1">Driver ID</p>
                    <p className="font-semibold text-gray-900">{claim.driver_id || '—'}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm font-medium text-gray-600 mb-1">Last Updated</p>
                    <p className="font-semibold text-gray-900">{claim.updated_at ? new Date(claim.updated_at).toLocaleDateString() : '—'}</p>
                  </div>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-2">Description</p>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-900 whitespace-pre-line">
                      {claim.description || 'No description provided'}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button onClick={toggleEdit} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    <FaEdit className="w-4 h-4" />
                    {editing? 'Cancel Edit':'Edit Claim'}
                  </button>
                  <button onClick={()=>handleStatusChange('closed')} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                    <FaCheckCircle className="w-4 h-4" />
                    Mark Resolved
                  </button>
                  <button onClick={()=>handleStatusChange('need_info')} className="flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors">
                    <FaExclamationTriangle className="w-4 h-4" />
                    Request Info
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'timeline' && (
              <div className="space-y-4">
                 <div>
                   <textarea value={newNote} onChange={(e)=>setNewNote(e.target.value)} rows={3} placeholder="Add note..." className="w-full border border-gray-300 rounded-lg p-2 text-black" />
                   <button onClick={addComment} className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg">Add Note</button>
                 </div>
                 <ul className="space-y-3">
                   {comments.map(c=>(<li key={c.id} className="border-l-4 border-blue-500 pl-3"><p className="text-sm">{c.note}</p><p className="text-xs text-gray-500">{new Date(c.created_at).toLocaleString()}</p></li>))}
                 </ul>
              </div>
            )}

            {activeTab === 'attachments' && (
              <div className="space-y-4">
                 <input type="file" onChange={handleFile} className="block" />
                 <ul className="space-y-2">
                   {attachments.map(a=>(<li key={a.id} className="flex items-center gap-2"><FaPaperclip/><a href={a.file_url} target="_blank" className="text-blue-600 underline">{a.file_name}</a><span className="text-xs text-gray-500">{new Date(a.created_at).toLocaleDateString()}</span></li>))}
                 </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------- Claim Submission Form ----------------
function ClaimForm({ onClose, onCreated, vehicles, drivers, bookings, partnerId }: {
  onClose: () => void;
  onCreated: () => void;
  vehicles: { id: string; name?: string; make?: string; model?: string; registration?: string }[];
  drivers: { id: string; name: string }[];
  bookings: { id: string; label: string }[];
  partnerId: string | null;
}) {
  const { user } = useAuth();
  const [severity, setSeverity] = useState<'low' | 'medium' | 'high'>('medium');
  const [description, setDescription] = useState('');
  const [vehicleId, setVehicleId] = useState('');
  const [driverId, setDriverId] = useState('');
  const [bookingId, setBookingId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [vehicleSearch, setVehicleSearch] = useState('');
  const [showVehicleDropdown, setShowVehicleDropdown] = useState(false);

  // use partnerId prop as initial value during submission
  console.log('User:', user);
  console.log('Partner ID prop:', partnerId);

  // Filter vehicles based on search
  const filteredVehicles = vehicles.filter(v => 
    (v.name || `${v.make || ''} ${v.model || ''}`.trim() || v.registration || 'Vehicle')
      .toLowerCase()
      .includes(vehicleSearch.toLowerCase())
  );

  // Get selected vehicle display name
  const selectedVehicle = vehicles.find(v => v.id === vehicleId);
  const selectedVehicleName = selectedVehicle 
    ? (selectedVehicle.name || `${selectedVehicle.make || ''} ${selectedVehicle.model || ''}`.trim() || selectedVehicle.registration || 'Vehicle')
    : '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!partnerId) {
      toast({ title: 'Missing partner ID', description: 'Could not determine partner.' });
      return;
    }
    if (!description.trim()) {
      toast({ title: 'Description required', description: 'Please add a description of the claim.' });
      return;
    }
    setSubmitting(true);
    const claimData = {
      partner_id: partnerId,
      status: 'open',
      severity,
      description: description.trim(),
      booking_id: bookingId || null,
      car_id: vehicleId || null,
      driver_id: driverId || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    console.log('Submitting claim:', claimData);
    const { error } = await sb.from('claims').insert([claimData]);
    setSubmitting(false);
    if (error) {
      console.error('Error creating claim', error);
      toast({ title: 'Error', description: error.message });
      return;
    }
    toast({ title: 'Claim submitted', description: 'Your claim has been submitted successfully.' });
    onClose();
    onCreated();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <FaCarCrash className="w-8 h-8 text-white" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Submit Vehicle Claim</h3>
        <p className="text-gray-600 text-sm">Provide details about the incident or issue</p>
      </div>

      {/* Severity */}
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
          <FaExclamationTriangle className="w-4 h-4 text-orange-500" />
          Severity Level
        </label>
        <div className="grid grid-cols-3 gap-3">
          {[
            { value: 'low', label: 'Low', color: 'bg-green-50 border-green-200 text-green-700', icon: FaCheckCircle },
            { value: 'medium', label: 'Medium', color: 'bg-yellow-50 border-yellow-200 text-yellow-700', icon: FaExclamationTriangle },
            { value: 'high', label: 'High', color: 'bg-red-50 border-red-200 text-red-700', icon: FaCarCrash }
          ].map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setSeverity(option.value as any)}
              className={`p-3 rounded-xl border-2 transition-all duration-200 flex flex-col items-center gap-2 ${
                severity === option.value
                  ? option.color + ' border-opacity-100'
                  : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
              }`}
            >
              <option.icon className="w-5 h-5" />
              <span className="text-sm font-medium">{option.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Vehicle Selection */}
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
          <FaCar className="w-4 h-4 text-blue-500" />
          Vehicle (Optional)
        </label>
        <div className="relative">
          <div className="relative">
            <input
              type="text"
              value={vehicleId ? selectedVehicleName : vehicleSearch}
              onChange={(e) => {
                if (vehicleId) {
                  setVehicleId('');
                  setVehicleSearch(e.target.value);
                } else {
                  setVehicleSearch(e.target.value);
                }
                setShowVehicleDropdown(true);
              }}
              onFocus={() => setShowVehicleDropdown(true)}
              placeholder="Search vehicles..."
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-gray-900 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
              {vehicleId ? (
                <button
                  type="button"
                  onClick={() => {
                    setVehicleId('');
                    setVehicleSearch('');
                    setShowVehicleDropdown(false);
                  }}
                  className="text-gray-400 hover:text-red-500 transition-colors"
                >
                  <FaTimes className="w-4 h-4" />
                </button>
              ) : (
                <FaSearch className="w-4 h-4 text-gray-400" />
              )}
            </div>
          </div>
          
          {/* Dropdown */}
          {showVehicleDropdown && (vehicleSearch || !vehicleId) && (
            <div className="absolute z-50 w-full mt-1 bg-white border-2 border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
              {filteredVehicles.length === 0 ? (
                <div className="px-4 py-3 text-gray-500 text-sm">
                  No vehicles found
                </div>
              ) : (
                filteredVehicles.map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => {
                      setVehicleId(v.id);
                      setVehicleSearch('');
                      setShowVehicleDropdown(false);
                    }}
                    className="w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0"
                  >
                    <div className="font-medium text-gray-900">
                      {v.name || `${v.make || ''} ${v.model || ''}`.trim() || v.registration || 'Vehicle'}
                    </div>
                    {v.registration && (
                      <div className="text-sm text-gray-500">
                        {v.registration}
                      </div>
                    )}
                  </button>
                ))
              )}
            </div>
          )}
        </div>
        
        {/* Click outside to close dropdown */}
        {showVehicleDropdown && (
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setShowVehicleDropdown(false)}
          />
        )}
      </div>

      {/* Driver Selection */}
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
          <FaUser className="w-4 h-4 text-green-500" />
          Driver (Optional)
        </label>
        <div className="relative">
          <select
            value={driverId}
            onChange={(e) => setDriverId(e.target.value)}
            className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-gray-900 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 appearance-none"
          >
            <option value="">Select a driver</option>
            {drivers.map((d) => (
              <option key={d.id} value={d.id} className="text-gray-900">
                {d.name}
              </option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <ChevronDownIcon className="w-4 h-4 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Booking Selection */}
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
          <FaCalendarAlt className="w-4 h-4 text-purple-500" />
          Booking (Optional)
        </label>
        <div className="relative">
          <select
            value={bookingId}
            onChange={(e) => setBookingId(e.target.value)}
            className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-gray-900 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 appearance-none"
          >
            <option value="">Select a booking</option>
            {bookings.map((b) => (
              <option key={b.id} value={b.id} className="text-gray-900">
                {b.label}
              </option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <ChevronDownIcon className="w-4 h-4 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
          <FaFileAlt className="w-4 h-4 text-indigo-500" />
          Description
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          rows={5}
          placeholder="Describe the incident, damage, or issue in detail..."
          className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-gray-900 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 resize-none"
        />
        <p className="text-xs text-gray-500 mt-1">
          Please provide as much detail as possible to help us process your claim quickly.
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 px-6 py-3 border-2 border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-all duration-200"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting || !description.trim()}
          className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-medium hover:from-blue-700 hover:to-purple-700 focus:ring-2 focus:ring-blue-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {submitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Submitting...
            </>
          ) : (
            <>
              <FaSave className="w-4 h-4" />
              Submit Claim
            </>
          )}
        </button>
      </div>
    </form>
  );
}
// ---------------- End ClaimForm ----------------

export default function PartnerClaimsPage() {
  const { user } = useAuth();
  const [allClaims, setAllClaims] = useState<ClaimDoc[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedClaimId, setSelectedClaimId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all'|ClaimDoc['status']>('all');
  const [severityFilter, setSeverityFilter] = useState<'all'|NonNullable<ClaimDoc['severity']>>('all');
  const [vehicles, setVehicles] = useState<{id:string; name:string; make:string; model:string; registration: string}[]>([]);
  const [drivers, setDrivers] = useState<{id:string; name:string;}[]>([]);
  const [bookings, setBookings] = useState<{id:string; label:string; vehicleId?:string; driverId?:string;}[]>([]);
  const [expandedVehicle, setExpandedVehicle] = useState<string|null>(null);
  const [expandedDriver, setExpandedDriver] = useState<string|null>(null);
  const router = useRouter();

  // --- Resolved Partner Id ---
  const [resolvedPartnerId, setResolvedPartnerId] = useState<string | null>(null);

  // Resolve partner id based on user role
  useEffect(() => {
    const resolvePartner = async () => {
      if (!user) return;
      const role = user.role?.toLowerCase();
      if (role === 'partner_staff') {
        const pid = (user as any).partnerId || (user as any).partner_id;
        if (pid) setResolvedPartnerId(pid);
      } else if (role === 'partner') {
        try {
          const { data: partnerRow, error } = await sb
            .from('partners')
            .select('id')
            .eq('user_id', user.id)
            .single();
          if (!error && partnerRow?.id) setResolvedPartnerId(partnerRow.id);
          else console.error('Unable to resolve partner_id for partner user', error);
        } catch (err) {
          console.error('Partner resolve exception', err);
        }
      }
    };
    resolvePartner();
  }, [user]);

  // Lookup maps
  const vehicleMap = useMemo(() => Object.fromEntries(vehicles.map(v => [v.id, v])), [vehicles]);
  const driverMap = useMemo(() => Object.fromEntries(drivers.map(d => [d.id, d])), [drivers]);
  const bookingMap = useMemo(() => Object.fromEntries(bookings.map(b => [b.id, b])), [bookings]);

  // Group claims by vehicle, then by driver
  const grouped = useMemo(() => {
    const out: Record<string, Record<string, ClaimDoc[]>> = {};
    allClaims.forEach(claim => {
      const carId = claim.carId || 'unknown';
      const driverId = (bookingMap[claim.bookingId || '']?.driverId) || 'unknown';
      if (!out[carId]) out[carId] = {};
      if (!out[carId][driverId]) out[carId][driverId] = [];
      out[carId][driverId].push(claim);
    });
    return out;
  }, [allClaims, bookingMap]);

  // Stats
  const totalClaims = allClaims.length;
  const openClaims = allClaims.filter(c => c.status === 'open').length;
  const closedClaims = allClaims.filter(c => c.status === 'closed').length;
  const needInfoClaims = allClaims.filter(c => c.status === 'need_info').length;
  const highSeverity = allClaims.filter(c => c.severity === 'high').length;

  // Search/filter state
  const [search, setSearch] = useState('');
  const [vehicleFilter, setVehicleFilter] = useState('');
  const [driverFilter, setDriverFilter] = useState('');

  // Compute only vehicles/drivers with claims
  const claimedVehicleIds = Array.from(new Set(allClaims.map(c => c.carId).filter(Boolean)));
  const claimedDriverIds = Array.from(new Set(allClaims.map(c => bookingMap[c.bookingId || '']?.driverId).filter(Boolean)));
  const claimedVehicles = vehicles.filter(v => claimedVehicleIds.includes(v.id));
  const claimedDrivers = drivers.filter(d => claimedDriverIds.includes(d.id));

  // Filtered claims
  const filteredClaims = useMemo(() => {
    return allClaims.filter((c) => {
      const statusOk = statusFilter === 'all' || c.status === statusFilter;
      const severityOk = severityFilter === 'all' || (c.severity || 'medium') === severityFilter;
      const vehicleOk = !vehicleFilter || c.carId === vehicleFilter;
      const driverOk = !driverFilter || (bookingMap[c.bookingId || '']?.driverId === driverFilter);
      const searchOk = !search ||
        c.description?.toLowerCase().includes(search.toLowerCase()) ||
        vehicleMap[c.carId || '']?.name?.toLowerCase().includes(search.toLowerCase()) ||
        driverMap[bookingMap[c.bookingId || '']?.driverId || '']?.name?.toLowerCase().includes(search.toLowerCase());
      return statusOk && severityOk && vehicleOk && driverOk && searchOk;
    });
  }, [allClaims, statusFilter, severityFilter, vehicleFilter, driverFilter, search, vehicleMap, driverMap, bookingMap]);



  const fetchClaims = async () => {
    if (!user) return;
    setLoading(true);
    try {
      if (!resolvedPartnerId) { setAllClaims([]); return; }
      // Supabase query for claims
      const { data, error } = await sb
        .from('claims')
        .select('*')
        .eq('partner_id', resolvedPartnerId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching claims:', error);
        return;
      }

      const list: ClaimDoc[] = data.map((d: any) => ({
        id: d.id,
        createdAt: d.created_at,
        status: d.status,
        severity: d.severity,
        description: d.description,
        bookingId: d.booking_id,
        carId: d.car_id,
        driverId: d.driver_id
      }));
      setAllClaims(list);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClaims();
    // fetch vehicles list for claim creation and lookup
    const fetchVehicles = async () => {
      if (!user) return;
      if (!resolvedPartnerId) return;
      const { data, error } = await sb
        .from('vehicles')
        .select('*')
        .eq('partner_id', resolvedPartnerId);

      if (error) {
        console.error('Error fetching vehicles:', error);
        return;
      }
      const list = data.map((d: any) => ({
        id: d.id,
        name: d.name || `${d.make || ''} ${d.model || ''}`.trim() || d.registration_number || d.license_plate || d.registration_plate || 'Vehicle',
        make: d.make,
        model: d.model,
        registration: d.registration_number || d.license_plate || d.registration_plate
      }));
      setVehicles(list);
    };
    fetchVehicles();
    // fetch drivers for lookup
    const fetchDrivers = async () => {
      if (!user) return;
      if (!resolvedPartnerId) return;
      const { data, error } = await supabase
        .from('drivers')
        .select('*')
        .eq('partner_id', resolvedPartnerId);

      if (error) {
        console.error('Error fetching drivers:', error);
        return;
      }
      const list = data.map((d: any) => ({
        id: d.id,
        name: d.name || d.full_name || 'Unknown Driver'
      }));
      setDrivers(list);
    };
    fetchDrivers();
    // fetch bookings list
    const fetchBookings = async () => {
      if (!user) return;
      if (!resolvedPartnerId) return;
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('partner_id', resolvedPartnerId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching bookings:', error);
        return;
      }
      const list = data.map((d: any) => {
        const carName = d.car_name || (d.car_info?.make ? d.car_info.make + ' ' + d.car_info.model : 'Vehicle');
        const carReg = d.car_info?.registration_number || d.car_info?.license_plate || d.car_info?.registration_plate || d.car_plate || '';
        const carLabel = carReg ? `${carName} – ${carReg}` : carName;
        const driverName = d.driver_name || d.driver?.name || 'Driver';
        const dateObj = d.start_date ? (d.start_date.seconds ? new Date(d.start_date.seconds * 1000) : new Date(d.start_date)) : (d.created_at?.seconds ? new Date(d.created_at.seconds * 1000) : (d.created_at ? new Date(d.created_at) : null));
        const dateStr = dateObj && !isNaN(dateObj.getTime()) ? dateObj.toLocaleDateString() : '';
        const label = `${carLabel} • Driver: ${driverName}${dateStr ? ' • ' + dateStr : ''}`;
        return { id: d.id, label, vehicleId: d.car_id, driverId: d.driver_id };
      });
      setBookings(list);
      // merge drivers derived from bookings
      const existingIds = new Set(drivers.map(d=>d.id));
      const additions = list
        .filter(b=>b.driverId && !existingIds.has(b.driverId))
        .map(b=>({ id: b.driverId as string, name: driverMap[b.driverId as string]?.name || 'Driver ' + b.driverId?.slice?.(0,6) || 'Unknown Driver' }));
      if (additions.length) setDrivers(prev=>[...prev, ...additions]);

      // fetch missing driver names asynchronously without blocking
      (async () => {
        const idsToFetch = additions.filter(a=>a.name.startsWith('Driver ')).map(a=>a.id);
        if (!idsToFetch.length) return;
        const fetched: {id:string; name:string}[] = [];
        for (const did of idsToFetch) {
          try {
            const { data: driverData, error: driverError } = await supabase
              .from('drivers')
              .select('id, name, full_name, email')
              .eq('id', did)
              .single();
            if (driverError) {
              console.error('Error fetching driver by ID:', driverError);
              continue;
            }
            if (driverData) {
              const drec: any = driverData as any;
              fetched.push({ id: drec.id, name: drec.name || drec.full_name || drec.email || drec.id });
            }
          } catch {}
        }
        if (fetched.length) setDrivers(prev=>{
          const map = new Map(prev.map(p=>[p.id,p]));
          fetched.forEach(f=>map.set(f.id,f));
          return Array.from(map.values());
        });
      })();
    };
    fetchBookings();
  }, [user, resolvedPartnerId]);

  // Open drawer if claimId is in URL
  useEffect(() => {
    const urlClaimId = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('claimId') : null;
    if (urlClaimId && urlClaimId !== selectedClaimId) {
      setSelectedClaimId(urlClaimId);
    }
  }, [selectedClaimId]);

  if (!user) return <div className="p-8">Please log in.</div>;

  const formatDate = (dt: string | Date | { seconds: number, toDate?: () => Date }) => {
    if (!dt) return '-';
    if (typeof dt === 'object' && dt !== null && 'seconds' in dt) {
      // Firestore Timestamp
      try {
        if (typeof dt.toDate === 'function') return dt.toDate().toLocaleDateString();
        return new Date(dt.seconds * 1000).toLocaleDateString();
      } catch { return '-'; }
    }
    if (dt instanceof Date) return dt.toLocaleDateString();
    if (typeof dt === 'string') {
      const d = new Date(dt);
      if (!isNaN(d.getTime())) return d.toLocaleDateString();
      return '-';
    }
    return '-';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Enhanced Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-6 gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Claims Management</h1>
              <p className="text-gray-600 mt-1">
                Track and manage vehicle claims efficiently
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => setShowForm(true)}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-purple-700 focus:ring-2 focus:ring-blue-500 transition-all duration-200 shadow-lg"
              >
                <FaPlus className="w-4 h-4" />
                Submit Claim
              </button>
              <button className="inline-flex items-center gap-2 bg-white text-gray-700 px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-all duration-200">
                <FaDownload className="w-4 h-4" />
                Export
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Enhanced Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Total Claims</p>
                <p className="text-3xl font-bold text-gray-900">{totalClaims}</p>
                <p className="text-xs text-blue-600 mt-1">All claims</p>
              </div>
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-3 rounded-xl">
                <FaListAlt className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Open</p>
                <p className="text-3xl font-bold text-gray-900">{openClaims}</p>
                <p className="text-xs text-green-600 mt-1">Active claims</p>
              </div>
              <div className="bg-gradient-to-br from-green-500 to-green-600 p-3 rounded-xl">
                <FaCheckCircle className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Closed</p>
                <p className="text-3xl font-bold text-gray-900">{closedClaims}</p>
                <p className="text-xs text-gray-600 mt-1">Resolved</p>
              </div>
              <div className="bg-gradient-to-br from-gray-500 to-gray-600 p-3 rounded-xl">
                <FaCarCrash className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Need Info</p>
                <p className="text-3xl font-bold text-gray-900">{needInfoClaims}</p>
                <p className="text-xs text-yellow-600 mt-1">Pending info</p>
              </div>
              <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 p-3 rounded-xl">
                <FaExclamationTriangle className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">High Severity</p>
                <p className="text-3xl font-bold text-gray-900">{highSeverity}</p>
                <p className="text-xs text-red-600 mt-1">Urgent</p>
              </div>
              <div className="bg-gradient-to-br from-red-500 to-red-600 p-3 rounded-xl">
                <FaCar className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>
        
        {/* Search and filters */}
        <div className="bg-white rounded-xl shadow p-4 mb-6 flex flex-wrap gap-4 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search claims, vehicles, drivers..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-blue-500 text-black placeholder-black"
          />
        </div>
        <select value={vehicleFilter} onChange={e=>setVehicleFilter(e.target.value)} className="px-4 py-2 rounded-lg border border-gray-200 text-black disabled:text-black" disabled={claimedVehicles.length === 0}>
          <option value="" className="text-black">All Vehicles</option>
          {claimedVehicles.map(v=>(<option key={v.id} value={v.id} className="text-black">{v.name || `${v.make || ''} ${v.model || ''}`.trim()} {v.registration ? ` – ${v.registration}` : ''}</option>))}
        </select>
        <select value={driverFilter} onChange={e=>setDriverFilter(e.target.value)} className="px-4 py-2 rounded-lg border border-gray-200 text-black disabled:text-black" disabled={claimedDrivers.length === 0}>
          <option value="" className="text-black">All Drivers</option>
          {claimedDrivers.map((d, idx) => (
            <option key={d.id + '-' + d.name + '-' + idx} value={d.id} className="text-black">{d.name}</option>
          ))}
        </select>
        <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value as any)} className="px-4 py-2 rounded-lg border border-gray-200 text-black disabled:text-black">
          {STATUS_OPTIONS.map(opt=>(<option key={opt.value} value={opt.value}>{opt.label}</option>))}
        </select>
        <select value={severityFilter} onChange={e=>setSeverityFilter(e.target.value as any)} className="px-4 py-2 rounded-lg border border-gray-200 text-black disabled:text-black">
          {SEVERITY_OPTIONS.map(opt=>(<option key={opt.value} value={opt.value}>{opt.label}</option>))}
        </select>
      </div>
      {/* Claims list */}
      <div className="bg-white rounded-xl shadow p-4">
        {loading ? (
          <div className="p-8 text-center">Loading claims…</div>
        ) : filteredClaims.length === 0 ? (
          <div className="p-8 text-center text-black">No claims match current filters.</div>
        ) : (
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="p-2 text-left text-black">Date</th>
                <th className="p-2 text-left text-black">Vehicle</th>
                <th className="p-2 text-left text-black">Driver</th>
                <th className="p-2 text-left text-black">Booking</th>
                <th className="p-2 text-left text-black">Status</th>
                <th className="p-2 text-left text-black">Severity</th>
                <th className="p-2 text-left text-black">Description</th>
              </tr>
            </thead>
            <tbody>
              {filteredClaims.map(c => (
                <tr key={c.id} className="border-b hover:bg-blue-50 cursor-pointer" onClick={() => setSelectedClaimId(c.id)}>
                  <td className="p-2 whitespace-nowrap text-black">{formatDate(c.createdAt)}</td>
                  <td className="p-2 whitespace-nowrap text-black">{vehicleMap[c.carId || ''] ? `${vehicleMap[c.carId || ''].name || vehicleMap[c.carId || ''].make + ' ' + vehicleMap[c.carId || ''].model}${vehicleMap[c.carId || ''].registration ? ' – ' + vehicleMap[c.carId || ''].registration : ''}` : (c.carId || '-')}</td>
                  <td className="p-2 whitespace-nowrap text-black">{
                    (() => {
                      if (c.driverId && typeof c.driverId === 'string') {
                        const d = driverMap ? driverMap[c.driverId] : undefined;
                        return d?.name || c.driverId;
                      }
                      const bookingDriverId = bookingMap[c.bookingId || '']?.driverId;
                      if (bookingDriverId && typeof bookingDriverId === 'string') {
                        const d = driverMap ? driverMap[bookingDriverId] : undefined;
                        return d?.name || bookingDriverId;
                      }
                      return '-';
                    })()
                  }</td>
                  <td className="p-2 whitespace-nowrap text-black">{bookingMap[c.bookingId || '']?.label || c.bookingId || '-'}</td>
                  <td className="p-2 whitespace-nowrap text-black"><StatusBadge status={c.status} /></td>
                  <td className="p-2 whitespace-nowrap text-black"><SeverityBadge severity={c.severity} /></td>
                  <td className="p-2 truncate max-w-xs text-black">{c.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {/* Claim form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-2 sm:p-6" style={{backdropFilter:'blur(8px)'}}>
          <div className="bg-white rounded-xl shadow-lg w-full max-w-lg relative mx-2 sm:mx-0 max-h-[90vh] overflow-y-auto">
            <button
              className="absolute top-4 right-4 text-2xl text-gray-400 hover:text-blue-600 z-10"
              onClick={() => setShowForm(false)}
              aria-label="Close claim form"
            >
              &times;
            </button>
            <div className="p-6 sm:p-8">
              <ClaimForm
                onClose={() => setShowForm(false)}
                onCreated={fetchClaims}
                vehicles={vehicles}
                drivers={drivers}
                bookings={bookings}
                partnerId={resolvedPartnerId}
              />
            </div>
          </div>
        </div>
      )}
      {selectedClaimId && (
        <ClaimDetailDrawer
          claimId={selectedClaimId}
          onClose={() => {
            setSelectedClaimId(null);
            const params = new URLSearchParams(window.location.search);
            params.delete('claimId');
            const newUrl = window.location.pathname + (params.toString() ? `?${params}` : '');
            router.replace(newUrl);
          }}
          onUpdated={fetchClaims}
        />
      )}
    </div>
  </div>
);
} 