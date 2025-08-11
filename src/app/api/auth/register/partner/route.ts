import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      email,
      password,
      phone,
      companyName,
      businessEmail,
      directorName,
      directorEmail,
      directorPhone,
      address
    } = body;

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

    // Check if email already exists in auth.users
    const { data: existingAuthUser } = await admin.auth.admin.listUsers();
    const emailExists = existingAuthUser?.users?.some(user => user.email?.toLowerCase() === email.toLowerCase());
    
    if (emailExists) {
      return NextResponse.json({ 
        error: 'A user with this email address has already been registered. Please use a different email address.' 
      }, { status: 400 });
    }

    // Check if email exists in public.users table
    const { data: existingPublicUser } = await admin
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase())
      .maybeSingle();

    if (existingPublicUser) {
      return NextResponse.json({ 
        error: 'A user with this email address has already been registered. Please use a different email address.' 
      }, { status: 400 });
    }

    // 1. Create auth user
    const { data: { user }, error: authError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        name,
        role: 'PARTNER',
        accountType: 'partner'
      },
      app_metadata: {
        role: 'partner'
      }
    });

    if (authError) {
      console.error('Auth creation error:', authError);
      
      // Provide specific error message for duplicate email
      if (authError.message.includes('already been registered') || authError.code === 'email_exists') {
        return NextResponse.json({ 
          error: 'A user with this email address has already been registered. Please use a different email address.' 
        }, { status: 400 });
      }
      
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    if (!user) {
      return NextResponse.json({ error: 'Failed to create user' }, { status: 400 });
    }

    let userId: string | null = null;

    if (user) {
      userId = user.id;
    }

    if (!userId) {
      return NextResponse.json({ error: 'User ID not available after creation' }, { status: 500 });
    }

    // Ensure user profile exists in public.users
    const { data: existingUser, error: userCheckError } = await admin
      .from('users')
      .select('id')
      .eq('id', userId)
      .single();

    if (!existingUser) {
      const { error: userError } = await admin
        .from('users')
        .insert({
          id: userId,
          email,
          phone,
          first_name: name.split(' ')[0] || name,
          last_name: name.split(' ').slice(1).join(' ') || '',
          role: 'partner',
          is_active: true,
          is_verified: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (userError) {
        console.error('User insert error:', userError);
        return NextResponse.json({ error: userError.message }, { status: 400 });
      }
    }

    // Ensure partner record exists in public.partners
    const { data: existingPartner, error: partnerCheckError } = await admin
      .from('partners')
      .select('id')
      .eq('id', userId)
      .single();

    if (!existingPartner) {
      const { error: partnerError } = await admin.from('partners').insert({
        id: userId,
        user_id: userId,
        company_name: companyName || 'New Partner',
        contact_name: name,
        contact_person: name,
        email,
        business_email: businessEmail || null,
        phone,
        director_name: directorName || null,
        director_email: directorEmail || null,
        director_phone: directorPhone || null,
        address: address || null,
        city: address?.city || null,
        postal_code: address?.postcode || null,
        status: 'pending',
        approval_status: 'pending',
        documents_approved: false,
        business_approved: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      if (partnerError) {
        return NextResponse.json({ error: partnerError.message }, { status: 400 });
      }
    }

    return NextResponse.json({ success: true, userId }, { status: 200 });
  } catch (error: any) {
    console.error('Server error:', error);
    return NextResponse.json({ error: error?.message || 'Unexpected error' }, { status: 500 });
  }
}
