import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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
      address,
      website,
      businessType,
      registrationNumber,
      vatNumber,
      operatingAreas,
      vehicleTypes,
      fleetSize,
      estimatedMonthlyRides,
      commissionRate,
      documents
    } = body;

    // Check if email already exists in auth.users
    const { data: existingAuthUser } = await supabase.auth.admin.listUsers();
    const emailExists = existingAuthUser?.users?.some(user => user.email?.toLowerCase() === email.toLowerCase());
    
    if (emailExists) {
      return NextResponse.json({ 
        error: 'A user with this email address has already been registered. Please use a different email address.' 
      }, { status: 400 });
    }

    // Check if email exists in public.users table
    const { data: existingPublicUser } = await supabase
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
    const { data: { user }, error: authError } = await supabase.auth.admin.createUser({
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

    const userId = user.id;

    // 2. Upload documents to Supabase Storage
    const documentUrls: { [key: string]: { url: string; uploaded_at: string } } = {};
    const STORAGE_BUCKET = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || 'partner-documents';

    for (const [key, fileData] of Object.entries(documents)) {
      if (fileData && typeof fileData === 'object' && 'base64' in fileData) {
        // Convert base64 to buffer
        const base64Data = (fileData as any).base64.split(',')[1];
        const buffer = Buffer.from(base64Data, 'base64');
        const fileName = (fileData as any).name;
        const fileType = (fileData as any).type;
        
        const filePath = `${userId}/${key}-${uuidv4()}-${fileName}`;
        
        const { error: uploadError } = await supabase.storage
          .from(STORAGE_BUCKET)
          .upload(filePath, buffer, {
            contentType: fileType,
            upsert: true,
          });

        if (uploadError) {
          console.error('Upload error:', uploadError);
          continue; // Skip this document but continue with others
        }

        const { data: publicUrl } = supabase.storage
          .from(STORAGE_BUCKET)
          .getPublicUrl(filePath);

        documentUrls[key] = {
          url: publicUrl.publicUrl,
          uploaded_at: new Date().toISOString(),
        };
      }
    }

    // 3. Insert user profile
    const { error: userError } = await supabase
      .from('users')
      .insert({
        id: userId,
        email,
        phone,
        first_name: name.split(' ')[0] || name,
        last_name: name.split(' ').slice(1).join(' ') || '',
        role: 'PARTNER',
        is_active: true,
        is_verified: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

    if (userError) {
      console.error('User insert error:', userError);
      return NextResponse.json({ error: userError.message }, { status: 400 });
    }

    // 4. Insert partner record
    const partnerPayload = {
      id: userId,
      user_id: userId,
      company_name: companyName,
      contact_name: name,
      contact_person: name,
      email,
      business_email: businessEmail || null,
      phone,
      website: website || null,
      business_type: businessType || null,
      registration_number: registrationNumber || null,
      vat_number: vatNumber || null,
      director_name: directorName || null,
      director_email: directorEmail || null,
      director_phone: directorPhone || null,
      status: 'pending',
      approval_status: 'pending',
      documents_approved: false,
      business_approved: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      address: address || null,
      location: address?.city || null,
      city: address?.city || null,
      postal_code: address?.postcode || null,
      operating_areas: operatingAreas || null,
      vehicle_types: vehicleTypes || null,
      fleet_size: fleetSize || null,
      estimated_vehicle_count: estimatedMonthlyRides || null,
      commission_rate: commissionRate || null,
      documents: documentUrls,
    };

    const { error: partnerError } = await supabase
      .from('partners')
      .insert(partnerPayload);

    if (partnerError) {
      console.error('Partner insert error:', partnerError);
      return NextResponse.json({ error: partnerError.message }, { status: 400 });
    }

    // 5. Insert documents for admin review
    for (const [docType, docData] of Object.entries(documentUrls)) {
      const { error: docError } = await supabase
        .from('documents')
        .insert({
          partner_id: userId,
          uploader_id: userId,
          name: `${docType.toUpperCase()} Document`,
          type: docType,
          category: 'business',
          file_name: `${docType}_document.pdf`,
          file_url: docData.url,
          file_size: 0,
          mime_type: 'application/pdf',
          status: 'pending_review',
          approval_status: 'pending_review',
          uploader_name: name,
          uploader_email: email,
          uploader_type: 'partner',
          partner_name: companyName,
          notes: `Uploaded during admin partner creation`
        });

      if (docError) {
        console.error('Document insert error:', docError);
        // Don't fail the entire operation for document insert errors
      }
    }

    return NextResponse.json({ 
      success: true, 
      userId,
      message: 'Partner account created successfully' 
    });

  } catch (error) {
    console.error('Error creating partner:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    }, { status: 500 });
  }
} 