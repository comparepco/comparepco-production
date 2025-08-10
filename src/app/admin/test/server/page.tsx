import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export default async function AdminTestServerPage() {
  let partners: any[] = [];
  let error: string | null = null;

  try {
    console.log('🔍 Loading partners from server...');
    const { data, error: fetchError } = await supabaseAdmin
      .from('partners')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (fetchError) {
      console.error('❌ Error loading partners:', fetchError);
      error = fetchError.message;
    } else {
      console.log('✅ Partners loaded from server:', data);
      partners = data || [];
    }
  } catch (err: any) {
    console.error('❌ General error:', err);
    error = err.message;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Admin Test Page (Server-Side)</h1>
        
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-700">Error: {error}</p>
          </div>
        )}

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
                  <pre className="text-xs bg-gray-100 p-2 mt-2 rounded">
                    {JSON.stringify(partner, null, 2)}
                  </pre>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 