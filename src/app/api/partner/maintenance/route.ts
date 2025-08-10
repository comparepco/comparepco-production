import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const partnerId = searchParams.get('partnerId');
    const userId = searchParams.get('userId');

    if (!partnerId && !userId) {
      return NextResponse.json({ error: 'Partner ID or User ID is required' }, { status: 400 });
    }

    let actualPartnerId = partnerId;

    // If userId is provided, get the partner ID
    if (!partnerId && userId) {
      const { data: staffData, error: staffError } = await supabase
        .from('partner_staff')
        .select('partner_id')
        .eq('user_id', userId)
        .single();

      if (staffError || !staffData) {
        // Try to get partner directly
        const { data: partnerData, error: partnerError } = await supabase
          .from('partners')
          .select('id')
          .eq('user_id', userId)
          .single();

        if (partnerError || !partnerData) {
          return NextResponse.json({ error: 'Partner not found' }, { status: 404 });
        }
        actualPartnerId = partnerData.id;
      } else {
        actualPartnerId = staffData.partner_id;
      }
    }

    console.log('🔍 Fetching maintenance records for partner:', actualPartnerId);

    const { data: records, error } = await supabase
      .from('maintenance_records')
      .select('*')
      .eq('partner_id', actualPartnerId)
      .order('scheduled_date', { ascending: false });

    if (error) {
      console.error('❌ Error fetching maintenance records:', error);
      return NextResponse.json({ error: 'Failed to fetch maintenance records' }, { status: 500 });
    }

    console.log('✅ Found maintenance records:', records?.length || 0);

    return NextResponse.json({
      records: records || []
    });

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      partner_id,
      car_id,
      car_name,
      car_plate,
      type,
      title,
      description,
      priority,
      scheduled_date,
      cost,
      estimated_cost,
      mileage,
      next_service_mileage,
      provider,
      parts,
      notes,
      created_by
    } = body;

    if (!partner_id || !car_id || !title || !scheduled_date) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    console.log('🔧 Creating maintenance record for partner:', partner_id);

    const recordData = {
      partner_id,
      car_id,
      car_name,
      car_plate,
      type,
      title,
      description,
      status: 'scheduled',
      priority: priority || 'medium',
      scheduled_date,
      cost: cost || 0,
      estimated_cost: estimated_cost || 0,
      mileage: mileage || 0,
      next_service_mileage,
      provider: provider || { name: '', contact: '', address: '', rating: null },
      parts: parts || [],
      attachments: [],
      notes,
      created_by,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('maintenance_records')
      .insert(recordData)
      .select()
      .single();

    if (error) {
      console.error('❌ Error creating maintenance record:', error);
      return NextResponse.json({ error: 'Failed to create maintenance record' }, { status: 500 });
    }

    console.log('✅ Created maintenance record:', data.id);

    return NextResponse.json({
      record: data
    });

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'Maintenance record ID is required' }, { status: 400 });
    }

    console.log('🔧 Updating maintenance record:', id);

    const updateData = {
      ...updates,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('maintenance_records')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('❌ Error updating maintenance record:', error);
      return NextResponse.json({ error: 'Failed to update maintenance record' }, { status: 500 });
    }

    console.log('✅ Updated maintenance record:', data.id);

    return NextResponse.json({
      record: data
    });

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: 'Maintenance record ID is required' }, { status: 400 });
    }

    console.log('🗑️ Deleting maintenance record:', id);

    const { error } = await supabase
      .from('maintenance_records')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('❌ Error deleting maintenance record:', error);
      return NextResponse.json({ error: 'Failed to delete maintenance record' }, { status: 500 });
    }

    console.log('✅ Deleted maintenance record:', id);

    return NextResponse.json({
      success: true
    });

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 