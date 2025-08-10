import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

// GET /api/partner/staff?userId=xxx or ?partnerId=xxx
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const partnerId = searchParams.get('partnerId');

    if (!userId && !partnerId) {
      return NextResponse.json({ error: 'User ID or Partner ID is required' }, { status: 400 });
    }

    let actualPartnerId = partnerId;

    // If userId is provided, get the partner ID
    if (!partnerId && userId) {
      // First try to get from partner_staff table
      const { data: staffData, error: staffError } = await supabaseAdmin
        .from('partner_staff')
        .select('partner_id')
        .eq('user_id', userId)
        .single();

      if (!staffError && staffData) {
        actualPartnerId = staffData.partner_id;
      } else {
        // Try to get from partners table
        const { data: partnerData, error: partnerError } = await supabaseAdmin
          .from('partners')
          .select('id')
          .eq('user_id', userId)
          .single();

        if (!partnerError && partnerData) {
          actualPartnerId = partnerData.id;
        }
      }
    }

    if (!actualPartnerId) {
      return NextResponse.json({ error: 'Partner not found' }, { status: 404 });
    }

    // Get staff members for this partner
    const { data: staff, error } = await supabaseAdmin
      .from('partner_staff')
      .select(`
        *,
        user:users(
          id,
          email,
          first_name,
          last_name,
          phone,
          avatar_url,
          is_active,
          created_at
        )
      `)
      .eq('partner_id', actualPartnerId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching staff:', error);
      return NextResponse.json({ error: 'Failed to fetch staff' }, { status: 500 });
    }

    return NextResponse.json({ 
      staff: staff || [],
      count: staff?.length || 0
    });

  } catch (error) {
    console.error('Staff GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/partner/staff - Create new staff member
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      partnerId, 
      email, 
      firstName, 
      lastName, 
      phone, 
      role = 'assistant',
      department = 'Operations',
      position,
      permissions = {},
      salary,
      address,
      emergencyContact
    } = body;

    if (!partnerId || !email || !firstName || !lastName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Create user account first
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: 'tempPassword123!', // Will be changed on first login
      email_confirm: true,
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
        phone: phone,
        role: 'PARTNER_STAFF'
      }
    });

    if (userError) {
      console.error('Error creating user:', userError);
      return NextResponse.json({ error: 'Failed to create user account' }, { status: 500 });
    }

    // Create staff record
    const { data: staffData, error: staffError } = await supabaseAdmin
      .from('partner_staff')
      .insert({
        partner_id: partnerId,
        user_id: userData.user.id,
        role,
        department,
        position,
        salary,
        address,
        emergency_contact_name: emergencyContact?.name,
        emergency_contact_phone: emergencyContact?.phone,
        emergency_contact_relationship: emergencyContact?.relationship,
        permissions,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (staffError) {
      console.error('Error creating staff record:', staffError);
      // Clean up user if staff creation fails
      await supabaseAdmin.auth.admin.deleteUser(userData.user.id);
      return NextResponse.json({ error: 'Failed to create staff record' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      staff: staffData,
      message: 'Staff member created successfully'
    });

  } catch (error) {
    console.error('Staff POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/partner/staff - Update staff member
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { staffId, updates } = body;

    if (!staffId || !updates) {
      return NextResponse.json({ error: 'Staff ID and updates are required' }, { status: 400 });
    }

    const { data: staffData, error } = await supabaseAdmin
      .from('partner_staff')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', staffId)
      .select()
      .single();

    if (error) {
      console.error('Error updating staff:', error);
      return NextResponse.json({ error: 'Failed to update staff' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      staff: staffData,
      message: 'Staff member updated successfully'
    });

  } catch (error) {
    console.error('Staff PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/partner/staff?staffId=xxx
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const staffId = searchParams.get('staffId');

    if (!staffId) {
      return NextResponse.json({ error: 'Staff ID is required' }, { status: 400 });
    }

    // Get staff record to get user_id
    const { data: staffData, error: fetchError } = await supabaseAdmin
      .from('partner_staff')
      .select('user_id')
      .eq('id', staffId)
      .single();

    if (fetchError || !staffData) {
      return NextResponse.json({ error: 'Staff member not found' }, { status: 404 });
    }

    // Delete staff record
    const { error: deleteError } = await supabaseAdmin
      .from('partner_staff')
      .delete()
      .eq('id', staffId);

    if (deleteError) {
      console.error('Error deleting staff:', deleteError);
      return NextResponse.json({ error: 'Failed to delete staff' }, { status: 500 });
    }

    // Delete user account
    const { error: userDeleteError } = await supabaseAdmin.auth.admin.deleteUser(staffData.user_id);
    if (userDeleteError) {
      console.error('Error deleting user account:', userDeleteError);
      // Don't fail the request if user deletion fails
    }

    return NextResponse.json({ 
      success: true,
      message: 'Staff member deleted successfully'
    });

  } catch (error) {
    console.error('Staff DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 