const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createBucket() {
  try {
    const { data, error } = await supabase.storage.createBucket('claim-attachments', {
      public: true,
      allowedMimeTypes: ['image/*', 'application/pdf', 'text/*'],
      fileSizeLimit: 52428800 // 50MB
    });

    if (error) {
      console.error('Error creating bucket:', error);
    } else {
      console.log('Bucket created successfully:', data);
    }
  } catch (err) {
    console.error('Exception creating bucket:', err);
  }
}

createBucket(); 