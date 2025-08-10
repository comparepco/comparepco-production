import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const { name, email, password, phone } = await request.json();

    if (!name || !email || !password || !phone) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json({ error: 'Server is missing Supabase configuration' }, { status: 500 });
    }

    const admin = createClient(supabaseUrl, serviceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // 1) Check if user already exists in public.users table
    const { data: existingProfile, error: profileCheckError } = await admin
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (profileCheckError) {
      return NextResponse.json({ error: profileCheckError.message }, { status: 400 });
    }

    let userId: string | null = null;

    if (existingProfile) {
      // User already exists, use their ID
      userId = existingProfile.id;
    } else {
      // 2) Create new user in auth with metadata
      const { data: created, error: createError } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          role: 'driver',
          name: name,
          accountType: 'driver'
        },
        app_metadata: {
          role: 'driver'
        }
      });
      
      if (createError || !created?.user) {
        return NextResponse.json({ 
          error: createError?.message || 'Failed to create auth user' 
        }, { status: 400 });
      }
      userId = created.user.id;
    }

    if (!userId) {
      return NextResponse.json({ error: 'User ID not available after creation' }, { status: 500 });
    }

    // 3) Create profile in public.users if doesn't exist
    if (!existingProfile) {
      const normalizedPhone = String(phone).replace(/\s/g, '');
      const firstName = (String(name).split(' ')[0] || String(name)).trim();
      const lastName = (String(name).split(' ').slice(1).join(' ') || '').trim();

      const { error: profileError } = await admin
        .from('users')
        .insert({
          id: userId,
          email,
          phone: normalizedPhone,
          first_name: firstName,
          last_name: lastName,
          role: 'driver',
          is_active: true,
          is_verified: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (profileError) {
        return NextResponse.json({ error: profileError.message }, { status: 400 });
      }
    }

    // 4) Ensure driver exists in public.drivers
    const { data: existingDriver, error: driverCheckError } = await admin
      .from('drivers')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (driverCheckError) {
      return NextResponse.json({ error: driverCheckError.message }, { status: 400 });
    }

    if (!existingDriver) {
      const { error: driverError } = await admin
        .from('drivers')
        .insert({
          user_id: userId,
          license_number: null,
          license_expiry: null,
          insurance_number: null,
          insurance_expiry: null,
          experience: 0,
          rating: 0,
          total_trips: 0,
          total_earnings: 0,
          status: 'pending',
          verification_status: 'pending',
          is_approved: false,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (driverError) {
        return NextResponse.json({ error: driverError.message }, { status: 400 });
      }
    }

    return NextResponse.json({ success: true, userId }, { status: 200 });
  } catch (error: any) {
    console.error('Server error:', error);
    return NextResponse.json({ error: error?.message || 'Unexpected error' }, { status: 500 });
  }
}