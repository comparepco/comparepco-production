'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { FaFileAlt, FaClock, FaCheck, FaTimes, FaEye, FaArrowLeft, FaSearch, FaFilter, FaUserTie, FaUser } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

interface Document {
  id: string;
  name: string;
  uploader_name: string;
  uploader_type: 'partner' | 'driver';
  upload_date: string;
  file_url?: string;
  type: string;
  status: string;
}

export default function DocumentReviewPage() {
  const { user: authUser, loading: authLoading } = useAuth();
  const router = useRouter();
  const [pendingDocs, setPendingDocs] = useState<Document[]>([]);
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
    const loadPendingDocuments = async () => {
      setLoading(true);
      try {
        const { data: documentsData, error } = await supabase
          .from('documents')
          .select('*')
          .eq('status', 'pending')
          .order('upload_date', { ascending: false });

        if (error) {
          console.error('Error loading pending documents:', error);
          toast.error('Failed to load pending documents');
        } else {
          setPendingDocs(documentsData || []);
        }
      } catch (error) {
        console.error('Error loading pending documents:', error);
        toast.error('Failed to load pending documents');
      } finally {
        setLoading(false);
      }
    };

    loadPendingDocuments();
  }, []);

  const handleReviewAction = async (docId: string, status: 'approved' | 'rejected') => {
    let reason = '';
    if (status === 'rejected') {
      reason = prompt('Please provide a reason for rejection:') || 'Rejected by admin';
    }

    try {
      const now = new Date().toISOString();
      
      const { error } = await supabase
        .from('documents')
        .update({
          status,
          rejection_reason: status === 'rejected' ? reason : null,
          approved_by: status === 'approved' ? authUser?.id : null,
          reviewed_at: now,
          updated_at: now
        })
        .eq('id', docId);

      if (error) {
        throw error;
      }

      toast.success(`Document ${status}.`);
      
      // Refresh documents
      const { data: updatedDocs } = await supabase
        .from('documents')
        .select('*')
        .eq('status', 'pending')
        .order('upload_date', { ascending: false });

      if (updatedDocs) {
        setPendingDocs(updatedDocs);
      }
    } catch (error) {
      console.error('Error updating document status:', error);
      toast.error('Failed to update document status.');
    }
  };

  const filteredDocuments = pendingDocs.filter(doc => {
    const matchesSearch = searchTerm === '' || 
      doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.uploader_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === 'all' || doc.uploader_type === filterType;
    
    return matchesSearch && matchesType;
  });

  const stats = {
    total: pendingDocs.length,
    partners: pendingDocs.filter(d => d.uploader_type === 'partner').length,
    drivers: pendingDocs.filter(d => d.uploader_type === 'driver').length,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading pending documents...</p>
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
              <FaFileAlt className="h-8 w-8 text-blue-600" />
              Document Review
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">{pendingDocs.length} document(s) awaiting your review.</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-gray-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-gray-600 dark:text-slate-400 text-sm mb-2">Total Pending</h3>
                <div className="text-3xl font-bold text-gray-900 dark:text-white">{stats.total}</div>
              </div>
              <FaClock className="text-2xl text-yellow-500" />
            </div>
          </div>
          
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-gray-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-gray-600 dark:text-slate-400 text-sm mb-2">Partner Documents</h3>
                <div className="text-3xl font-bold text-gray-900 dark:text-white">{stats.partners}</div>
              </div>
              <FaUserTie className="text-2xl text-blue-400" />
            </div>
          </div>
          
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-gray-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-gray-600 dark:text-slate-400 text-sm mb-2">Driver Documents</h3>
                <div className="text-3xl font-bold text-gray-900 dark:text-white">{stats.drivers}</div>
              </div>
              <FaUser className="text-2xl text-green-400" />
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
              <option value="partner">Partner Documents</option>
              <option value="driver">Driver Documents</option>
            </select>
          </div>
        </div>

        {/* Documents Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="text-left p-4 text-gray-700 dark:text-gray-300">Document Name</th>
                  <th className="text-left p-4 text-gray-700 dark:text-gray-300">Uploader</th>
                  <th className="text-left p-4 text-gray-700 dark:text-gray-300">Type</th>
                  <th className="text-left p-4 text-gray-700 dark:text-gray-300">Upload Date</th>
                  <th className="text-left p-4 text-gray-700 dark:text-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredDocuments.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-12">
                      <div className="text-center">
                        <FaFileAlt className="text-6xl text-gray-400 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-500 dark:text-gray-400 mb-2">No documents pending review</h3>
                        <p className="text-gray-500 dark:text-gray-400">
                          {pendingDocs.length === 0 
                            ? "All documents have been reviewed!"
                            : "Try adjusting your search or filter criteria"
                          }
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredDocuments.map(doc => (
                    <tr key={doc.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <td className="p-4">
                        <div className="font-medium text-gray-900 dark:text-white">{doc.name}</div>
                      </td>
                      <td className="p-4">
                        <div className="text-sm text-gray-900 dark:text-white">{doc.uploader_name}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 capitalize">({doc.uploader_type})</div>
                      </td>
                      <td className="p-4">
                        <div className="text-sm text-gray-500 dark:text-gray-400 capitalize">{doc.type}</div>
                      </td>
                      <td className="p-4 text-sm text-gray-500 dark:text-gray-400">
                        {doc.upload_date ? new Date(doc.upload_date).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
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
                          <button 
                            onClick={() => handleReviewAction(doc.id, 'approved')}
                            className="p-2 bg-green-600 hover:bg-green-700 text-white rounded text-sm transition-colors"
                            title="Approve Document"
                          >
                            <FaCheck className="text-xs" />
                          </button>
                          <button 
                            onClick={() => handleReviewAction(doc.id, 'rejected')}
                            className="p-2 bg-red-600 hover:bg-red-700 text-white rounded text-sm transition-colors"
                            title="Reject Document"
                          >
                            <FaTimes className="text-xs" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
} 