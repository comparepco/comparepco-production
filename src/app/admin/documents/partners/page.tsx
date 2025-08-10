'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { FaUserTie, FaFolderOpen, FaAngleRight, FaArrowLeft, FaSearch, FaUsers, FaFileAlt, FaBuilding } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

interface PartnerGroup {
  id: string;
  name: string;
  docCount: number;
  company_name?: string;
}

export default function PartnerDocumentsPage() {
  const { user: authUser, loading: authLoading } = useAuth();
  const router = useRouter();
  const [partnerGroups, setPartnerGroups] = useState<PartnerGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!authLoading && !authUser) {
      router.push('/auth/login');
      return;
    }
  }, [authUser, authLoading, router]);

  useEffect(() => {
    const loadPartnerDocuments = async () => {
      setLoading(true);
      try {
        // Get all partner documents
        const { data: documentsData, error: documentsError } = await supabase
          .from('documents')
          .select('*')
          .eq('uploader_type', 'partner');

        if (documentsError) {
          console.error('Error loading documents:', documentsError);
          toast.error('Failed to load partner documents');
        } else {
          // Group documents by partner
          const groups: { [key: string]: PartnerGroup } = {};

          for (const doc of documentsData || []) {
            const partnerId = doc.uploader_id;
            if (!partnerId) continue;

            const partnerName = doc.uploader_name || 'Unknown Partner';

            if (!groups[partnerId]) {
              groups[partnerId] = {
                id: partnerId,
                name: partnerName,
                docCount: 0,
              };
            }
            groups[partnerId].docCount++;
          }

          // Get additional partner information
          const partnerIds = Object.keys(groups);
          if (partnerIds.length > 0) {
            const { data: partnersData, error: partnersError } = await supabase
              .from('partners')
              .select('id, name, company_name')
              .in('id', partnerIds);

            if (!partnersError && partnersData) {
              // Update partner names with company names if available
              for (const partner of partnersData) {
                if (groups[partner.id]) {
                  groups[partner.id].name = partner.company_name || partner.name || groups[partner.id].name;
                  groups[partner.id].company_name = partner.company_name;
                }
              }
            }
          }

          const sortedGroups = Object.values(groups).sort((a, b) => a.name.localeCompare(b.name));
          setPartnerGroups(sortedGroups);
        }
      } catch (error) {
        console.error('Error loading partner documents:', error);
        toast.error('Failed to load partner documents');
      } finally {
        setLoading(false);
      }
    };

    loadPartnerDocuments();
  }, []);

  const filteredPartnerGroups = partnerGroups.filter(group => 
    searchTerm === '' || 
    group.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    totalPartners: partnerGroups.length,
    totalDocuments: partnerGroups.reduce((sum, group) => sum + group.docCount, 0),
    averageDocsPerPartner: partnerGroups.length > 0 
      ? Math.round(partnerGroups.reduce((sum, group) => sum + group.docCount, 0) / partnerGroups.length)
      : 0,
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
            <button
              onClick={() => router.back()}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <FaArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <FaUserTie className="h-8 w-8 text-blue-600" />
              Partner Documents
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">Select a partner to view their submitted documents.</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-gray-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-gray-600 dark:text-slate-400 text-sm mb-2">Total Partners</h3>
                <div className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalPartners}</div>
              </div>
              <FaUsers className="text-2xl text-blue-400" />
            </div>
          </div>
          
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-gray-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-gray-600 dark:text-slate-400 text-sm mb-2">Total Documents</h3>
                <div className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalDocuments}</div>
              </div>
              <FaFileAlt className="text-2xl text-green-400" />
            </div>
          </div>
          
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-gray-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-gray-600 dark:text-slate-400 text-sm mb-2">Avg Docs/Partner</h3>
                <div className="text-3xl font-bold text-gray-900 dark:text-white">{stats.averageDocsPerPartner}</div>
              </div>
              <FaBuilding className="text-2xl text-purple-400" />
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <div className="relative">
            <FaSearch className="absolute left-3 top-3 text-gray-400 text-sm" />
            <input
              type="text"
              placeholder="Search partners..."
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Partners Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="text-left p-4 text-gray-700 dark:text-gray-300">Partner Name</th>
                  <th className="text-left p-4 text-gray-700 dark:text-gray-300">Documents Submitted</th>
                  <th className="text-left p-4 text-gray-700 dark:text-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredPartnerGroups.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="text-center py-12">
                      <div className="text-center">
                        <FaUserTie className="text-6xl text-gray-400 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-500 dark:text-gray-400 mb-2">No partner documents found</h3>
                        <p className="text-gray-500 dark:text-gray-400">
                          {partnerGroups.length === 0 
                            ? "No partners have submitted any documents yet."
                            : "Try adjusting your search criteria"
                          }
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredPartnerGroups.map(group => (
                    <tr key={group.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <td className="p-4">
                        <div className="font-medium text-gray-900 dark:text-white">{group.name}</div>
                        {group.company_name && group.company_name !== group.name && (
                          <div className="text-sm text-gray-500 dark:text-gray-400">{group.company_name}</div>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-900 dark:text-white font-medium">{group.docCount}</span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">documents</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <Link 
                          href={`/admin/documents/partners/${group.id}`} 
                          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                        >
                          <FaFolderOpen className="text-xs" />
                          View Documents
                          <FaAngleRight className="text-xs" />
                        </Link>
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