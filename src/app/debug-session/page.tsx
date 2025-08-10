'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';

export default function DebugSession() {
  const [sessionInfo, setSessionInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    setLoading(true);
    
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      setSessionInfo({
        session: session ? {
          user: session.user?.email,
          access_token: session.access_token ? 'Present' : 'Missing',
          refresh_token: session.refresh_token ? 'Present' : 'Missing',
        } : null,
        user: user ? {
          id: user.id,
          email: user.email,
          role: user.user_metadata?.role,
        } : null,
        sessionError: error?.message,
        userError: userError?.message,
      });
    } catch (error) {
      setSessionInfo({ error: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    checkSession();
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Session Debug</h1>
      
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">Session Information</h2>
        <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
          {JSON.stringify(sessionInfo, null, 2)}
        </pre>
      </div>

      <div className="mt-4 space-y-2">
        <button
          onClick={checkSession}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Refresh Session Info
        </button>
        
        <button
          onClick={signOut}
          className="bg-red-500 text-white px-4 py-2 rounded ml-2"
        >
          Sign Out
        </button>
      </div>

      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-2">Quick Links:</h3>
        <ul className="space-y-2">
          <li>
            <a href="/test-login" className="text-blue-500 hover:underline">
              Test Login Page
            </a>
          </li>
          <li>
            <a href="/admin/staff" className="text-blue-500 hover:underline">
              Staff Management Page
            </a>
          </li>
          <li>
            <a href="/auth/login" className="text-blue-500 hover:underline">
              Main Login Page
            </a>
          </li>
        </ul>
      </div>
    </div>
  );
} 