'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { FaUserTie, FaEye, FaArrowLeft, FaTrash, FaSearch, FaFilter, FaFileAlt, FaCalendarAlt } from 'react-icons/fa';
import { useParams } from 'next/navigation';
import { toast } from 'react-hot-toast';

interface Document {
  id: string;
  name: string;
  upload_date: string;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  file_url?: string;
  expiry_date?: string;
  type: string;
}

interface Partner {
  id: string;
  name: string;
  company_name?: string;
}

export default function SinglePartnerDocumentsPage() {
  const { partnerId } = useParams<{ partnerId: string }>();
  const { user: authUser, loading: authLoading } = useAuth();
  const router = useRouter();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [partner, setPartner] = useState<Partner | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    if (!authLoading && !authUser) {
      router.push('/auth/login');
      return;
    }
  }, [authUser, authLoading, router]);

  useEffect(() => {
    const loadPartnerDocuments = async () => {
      if (!partnerId) return;
      
      setLoading(true);
      try {
        // Get Partner Info
        const { data: partnerData, error: partnerError } = await supabase
          .from('partners')
          .select('id, name, company_name')
          .eq('id', partnerId)
          .single();

        if (partnerError) {
          console.error('Error loading partner:', partnerError);
          toast.error('Failed to load partner information');
        } else if (partnerData) {
          setPartner({
            id: partnerData.id,
            name: partnerData.company_name || partnerData.name || 'Unknown Partner'
          });
        }

        // Get Partner Documents
        const { data: documentsData, error: documentsError } = await supabase
          .from('documents')
          .select('*')
          .eq('uploader_id', partnerId)
          .order('upload_date', { ascending: false });

        if (documentsError) {
          console.error('Error loading documents:', documentsError);
          toast.error('Failed to load documents');
        } else {
          setDocuments(documentsData || []);
        }
      } catch (error) {
        console.error('Error loading partner documents:', error);
        toast.error('Failed to load partner documents');
      } finally {
        setLoading(false);
      }
    };

    loadPartnerDocuments();
  }, [partnerId]);

  const handleDeleteDocument = async (documentId: string, documentName: string) => {
    if (confirm(`Are you sure you want to delete "${documentName}"? This action cannot be undone.`)) {
      try {
        const { error } = await supabase
          .from('documents')
          .delete()
          .eq('id', documentId);

        if (error) {
          throw error;
        }

        toast.success('Document deleted successfully');
        setDocuments(prev => prev.filter(doc => doc.id !== documentId));
      } catch (error) {
        console.error('Error deleting document:', error);
        toast.error('Failed to delete document');
      }
    }
  };

  const getStatusBadge = (status: string) => {
    const statusClasses: { [key: string]: string } = {
      approved: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
      rejected: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
      expired: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
    };
    return <span className={`px-2 py-1 rounded-full text-xs font-semibold capitalize ${statusClasses[status] || statusClasses.pending}`}>{status}</span>;
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = searchTerm === '' || 
      doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.type.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || doc.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: documents.length,
    pending: documents.filter(d => d.status === 'pending').length,
    approved: documents.filter(d => d.status === 'approved').length,
    rejected: documents.filter(d => d.status === 'rejected').length,
    expired: documents.filter(d => d.status === 'expired').length,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading partner documents...</p>
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
            <Link 
              href="/admin/documents/partners" 
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <FaArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <FaUserTie className="h-8 w-8 text-blue-600" />
              {partner?.name || 'Partner'} Documents
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">All documents submitted by {partner?.name || 'this partner'}.</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-gray-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-gray-600 dark:text-slate-400 text-sm mb-2">Total Documents</h3>
                <div className="text-3xl font-bold text-gray-900 dark:text-white">{stats.total}</div>
              </div>
              <FaFileAlt className="text-2xl text-blue-400" />
            </div>
          </div>
          
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-gray-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-gray-600 dark:text-slate-400 text-sm mb-2">Pending Review</h3>
                <div className="text-3xl font-bold text-gray-900 dark:text-white">{stats.pending}</div>
              </div>
              <FaFileAlt className="text-2xl text-yellow-400" />
            </div>
          </div>
          
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-gray-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-gray-600 dark:text-slate-400 text-sm mb-2">Approved</h3>
                <div className="text-3xl font-bold text-gray-900 dark:text-white">{stats.approved}</div>
              </div>
              <FaFileAlt className="text-2xl text-green-400" />
            </div>
          </div>
          
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-gray-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-gray-600 dark:text-slate-400 text-sm mb-2">Rejected</h3>
                <div className="text-3xl font-bold text-gray-900 dark:text-white">{stats.rejected}</div>
              </div>
              <FaFileAlt className="text-2xl text-red-400" />
            </div>
          </div>
          
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-gray-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-gray-600 dark:text-slate-400 text-sm mb-2">Expired</h3>
                <div className="text-3xl font-bold text-gray-900 dark:text-white">{stats.expired}</div>
              </div>
              <FaFileAlt className="text-2xl text-gray-400" />
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
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="expired">Expired</option>
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
                  <th className="text-left p-4 text-gray-700 dark:text-gray-300">Type</th>
                  <th className="text-left p-4 text-gray-700 dark:text-gray-300">Upload Date</th>
                  <th className="text-left p-4 text-gray-700 dark:text-gray-300">Expiry Date</th>
                  <th className="text-left p-4 text-gray-700 dark:text-gray-300">Status</th>
                  <th className="text-left p-4 text-gray-700 dark:text-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredDocuments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12">
                      <div className="text-center">
                        <FaFileAlt className="text-6xl text-gray-400 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-500 dark:text-gray-400 mb-2">No documents found</h3>
                        <p className="text-gray-500 dark:text-gray-400">
                          {documents.length === 0 
                            ? "This partner has not submitted any documents yet."
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
                        <div className="text-sm text-gray-500 dark:text-gray-400 capitalize">{doc.type}</div>
                      </td>
                      <td className="p-4 text-sm text-gray-500 dark:text-gray-400">
                        {doc.upload_date ? new Date(doc.upload_date).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="p-4 text-sm text-gray-500 dark:text-gray-400">
                        {doc.expiry_date ? new Date(doc.expiry_date).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="p-4">{getStatusBadge(doc.status)}</td>
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
                            onClick={() => handleDeleteDocument(doc.id, doc.name)}
                            className="p-2 bg-red-600 hover:bg-red-700 text-white rounded text-sm transition-colors"
                            title="Delete Document"
                          >
                            <FaTrash className="text-xs" />
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