'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { FaExclamationTriangle, FaEye, FaArrowLeft, FaSearch, FaFilter, FaCalendarAlt, FaClock } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

interface ExpiringDocument {
  id: string;
  name: string;
  type: string;
  uploader_name: string;
  uploader_type: 'partner' | 'driver';
  expiry_date: string;
  file_url?: string;
  status: string;
}

export default function ExpiringDocumentsPage() {
  const { user: authUser, loading: authLoading } = useAuth();
  const router = useRouter();
  const [documents, setDocuments] = useState<ExpiringDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    if (!authLoading && !authUser) {
      router.push('/auth/login');
      return;
    }
  }, [authUser, authLoading, router]);

  useEffect(() => {
    const loadExpiringDocuments = async () => {
      setLoading(true);
      try {
        const now = new Date();
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(now.getDate() + 30);

        const { data: documentsData, error } = await supabase
          .from('documents')
          .select('*')
          .eq('status', 'approved')
          .gte('expiry_date', now.toISOString())
          .lte('expiry_date', thirtyDaysFromNow.toISOString())
          .order('expiry_date', { ascending: true });

        if (error) {
          console.error('Error loading expiring documents:', error);
          toast.error('Failed to load expiring documents');
        } else {
          setDocuments(documentsData || []);
        }
      } catch (error) {
        console.error('Error loading expiring documents:', error);
        toast.error('Failed to load expiring documents');
      } finally {
        setLoading(false);
      }
    };

    loadExpiringDocuments();
  }, []);

  // Helper function to get document type icon
  const getTypeIcon = (type: string) => {
    const typeIcons: Record<string, string> = {
      driving_license: '🪪',
      insurance: '🛡️',
      pco_license: '🚗',
      proof_of_address: '🏠',
      business_license: '🏢',
      tax_certificate: '📋',
      vehicle_registration: '📄',
      mot_certificate: '🔧',
      businessLicense: '🏢',
      insuranceCertificate: '🛡️',
      operatorLicense: '🚗',
      taxCertificate: '📋'
    };
    return typeIcons[type] || '📄';
  };

  // Helper function to get urgency indicator
  const getUrgencyIndicator = (expiryDate: string) => {
    const now = new Date();
    const expiry = new Date(expiryDate);
    const daysUntilExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry <= 7) {
      return { color: 'text-red-600', bgColor: 'bg-red-100', borderColor: 'border-red-200', label: 'URGENT', days: daysUntilExpiry };
    } else if (daysUntilExpiry <= 14) {
      return { color: 'text-orange-600', bgColor: 'bg-orange-100', borderColor: 'border-orange-200', label: 'SOON', days: daysUntilExpiry };
    } else {
      return { color: 'text-yellow-600', bgColor: 'bg-yellow-100', borderColor: 'border-yellow-200', label: 'UPCOMING', days: daysUntilExpiry };
    }
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = searchTerm === '' || 
      doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.uploader_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === 'all' || doc.uploader_type === filterType;
    
    return matchesSearch && matchesType;
  });

  const stats = {
    total: documents.length,
    urgent: documents.filter(d => {
      const expiry = new Date(d.expiry_date);
      const now = new Date();
      const daysUntilExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return daysUntilExpiry <= 7;
    }).length,
    soon: documents.filter(d => {
      const expiry = new Date(d.expiry_date);
      const now = new Date();
      const daysUntilExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return daysUntilExpiry > 7 && daysUntilExpiry <= 14;
    }).length,
    upcoming: documents.filter(d => {
      const expiry = new Date(d.expiry_date);
      const now = new Date();
      const daysUntilExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return daysUntilExpiry > 14;
    }).length,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading expiring documents...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => router.back()}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <FaArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <FaExclamationTriangle className="h-8 w-8 text-yellow-500" />
              Expiring Documents
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">Documents that are set to expire within the next 30 days.</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-gray-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-gray-600 dark:text-slate-400 text-sm mb-2">Total Expiring</h3>
                <div className="text-3xl font-bold text-gray-900 dark:text-white">{stats.total}</div>
              </div>
              <FaExclamationTriangle className="text-2xl text-yellow-500" />
            </div>
          </div>
          
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-gray-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-gray-600 dark:text-slate-400 text-sm mb-2">Urgent (≤7 days)</h3>
                <div className="text-3xl font-bold text-gray-900 dark:text-white">{stats.urgent}</div>
              </div>
              <FaClock className="text-2xl text-red-500" />
            </div>
          </div>
          
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-gray-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-gray-600 dark:text-slate-400 text-sm mb-2">Soon (8-14 days)</h3>
                <div className="text-3xl font-bold text-gray-900 dark:text-white">{stats.soon}</div>
              </div>
              <FaClock className="text-2xl text-orange-500" />
            </div>
          </div>
          
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-gray-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-gray-600 dark:text-slate-400 text-sm mb-2">Upcoming (15-30 days)</h3>
                <div className="text-3xl font-bold text-gray-900 dark:text-white">{stats.upcoming}</div>
              </div>
              <FaCalendarAlt className="text-2xl text-yellow-500" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <FaSearch className="absolute left-3 top-3 text-gray-400 text-sm" />
                <input
                  type="text"
                  placeholder="Search documents..."
                  className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <select
              className="px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="all">All Types</option>
              <option value="driver">Driver Documents</option>
              <option value="partner">Partner Documents</option>
            </select>
          </div>
        </div>

        {/* Documents Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="text-left p-4 text-gray-700 dark:text-gray-300">Document</th>
                  <th className="text-left p-4 text-gray-700 dark:text-gray-300">Uploader</th>
                  <th className="text-left p-4 text-gray-700 dark:text-gray-300">Expires On</th>
                  <th className="text-left p-4 text-gray-700 dark:text-gray-300">Urgency</th>
                  <th className="text-left p-4 text-gray-700 dark:text-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredDocuments.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-12">
                      <div className="text-center">
                        <FaExclamationTriangle className="text-6xl text-gray-400 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-500 dark:text-gray-400 mb-2">No documents expiring soon</h3>
                        <p className="text-gray-500 dark:text-gray-400">
                          {documents.length === 0 
                            ? "All documents are up to date!"
                            : "Try adjusting your search or filter criteria"
                          }
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredDocuments.map(doc => {
                    const urgency = getUrgencyIndicator(doc.expiry_date);
                    return (
                      <tr key={doc.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{getTypeIcon(doc.type)}</span>
                            <div>
                              <div className="font-medium text-gray-900 dark:text-white">{doc.name}</div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">{doc.type}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="text-sm text-gray-900 dark:text-white">{doc.uploader_name}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 capitalize">({doc.uploader_type})</div>
                        </td>
                        <td className="p-4">
                          <div className={`font-medium ${urgency.color}`}>
                            {new Date(doc.expiry_date).toLocaleDateString()}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {urgency.days} day{urgency.days !== 1 ? 's' : ''} remaining
                          </div>
                        </td>
                        <td className="p-4">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${urgency.bgColor} ${urgency.color} border ${urgency.borderColor}`}>
                            {urgency.label}
                          </span>
                        </td>
                        <td className="p-4">
                          {doc.file_url && (
                            <a 
                              href={doc.file_url} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition-colors"
                              title="View Document"
                            >
                              <FaEye className="text-xs" />
                            </a>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
} 