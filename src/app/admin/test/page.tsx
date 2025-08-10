"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export default function AdminTestPage() {
  const [partners, setPartners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const { user } = useAuth();

  useEffect(() => {
    const loadPartners = async () => {
      try {
        console.log('🔍 Loading partners...');
        console.log('👤 Current user:', user);
        
        const { data, error } = await supabase
          .from('partners')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (error) {
          console.error('❌ Error loading partners:', error);
          setError(error.message);
          return;
        }
        
        console.log('✅ Partners loaded:', data);
        setPartners(data || []);
      } catch (err: any) {
        console.error('❌ General error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadPartners();
  }, [user]);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Admin Test Page</h1>
        
        {/* User Info */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-2">Current User</h2>
          {user ? (
            <div>
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>Role:</strong> {user.role}</p>
              <p><strong>ID:</strong> {user.id}</p>
            </div>
          ) : (
            <p className="text-red-600">Not authenticated</p>
          )}
        </div>
        
        {loading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4">Loading partners...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-700">Error: {error}</p>
          </div>
        )}

        {!loading && !error && (
          <div>
            <h2 className="text-xl font-semibold mb-4">
              Partners ({partners.length})
            </h2>
            
            {partners.length === 0 ? (
              <p className="text-gray-600">No partners found.</p>
            ) : (
              <div className="space-y-4">
                {partners.map((partner) => (
                  <div key={partner.id} className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold">{partner.company_name}</h3>
                    <p className="text-gray-600">{partner.email}</p>
                    <p className="text-sm text-gray-500">Status: {partner.status}</p>
                    <p className="text-sm text-gray-500">Created: {new Date(partner.created_at).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 