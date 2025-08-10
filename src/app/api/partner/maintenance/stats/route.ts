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

    console.log('📊 Fetching maintenance stats for partner:', actualPartnerId);

    // Get maintenance records
    const { data: records, error: recordsError } = await supabase
      .from('maintenance_records')
      .select('*')
      .eq('partner_id', actualPartnerId);

    if (recordsError) {
      console.error('❌ Error fetching maintenance records:', recordsError);
      return NextResponse.json({ error: 'Failed to fetch maintenance records' }, { status: 500 });
    }

    // Get vehicles
    const { data: vehicles, error: vehiclesError } = await supabase
      .from('vehicles')
      .select('*')
      .eq('partner_id', actualPartnerId);

    if (vehiclesError) {
      console.error('❌ Error fetching vehicles:', vehiclesError);
      return NextResponse.json({ error: 'Failed to fetch vehicles' }, { status: 500 });
    }

    // Calculate statistics
    const totalRecords = records?.length || 0;
    const scheduled = records?.filter(r => r.status === 'scheduled').length || 0;
    const inProgress = records?.filter(r => r.status === 'in_progress').length || 0;
    const completed = records?.filter(r => r.status === 'completed').length || 0;
    const overdue = records?.filter(r => r.status === 'overdue').length || 0;
    const cancelled = records?.filter(r => r.status === 'cancelled').length || 0;

    const totalCost = records?.reduce((sum, record) => sum + (record.cost || 0), 0) || 0;
    const estimatedCost = records?.reduce((sum, record) => sum + (record.estimated_cost || 0), 0) || 0;

    const upcoming = records?.filter(r => 
      r.status === 'scheduled' && 
      new Date(r.scheduled_date) > new Date()
    ).length || 0;

    const thisMonth = records?.filter(r => {
      const recordDate = new Date(r.scheduled_date);
      const now = new Date();
      return recordDate.getMonth() === now.getMonth() && 
             recordDate.getFullYear() === now.getFullYear();
    }).length || 0;

    // Vehicle status counts
    const totalVehicles = vehicles?.length || 0;
    const availableVehicles = vehicles?.filter(v => v.status === 'available').length || 0;
    const bookedVehicles = vehicles?.filter(v => v.status === 'booked').length || 0;
    const maintenanceVehicles = vehicles?.filter(v => v.status === 'maintenance').length || 0;
    const inactiveVehicles = vehicles?.filter(v => v.status === 'inactive').length || 0;

    const stats = {
      maintenance: {
        total: totalRecords,
        scheduled,
        inProgress,
        completed,
        overdue,
        cancelled,
        upcoming,
        thisMonth,
        totalCost: parseFloat(totalCost.toFixed(2)),
        estimatedCost: parseFloat(estimatedCost.toFixed(2))
      },
      vehicles: {
        total: totalVehicles,
        available: availableVehicles,
        booked: bookedVehicles,
        maintenance: maintenanceVehicles,
        inactive: inactiveVehicles
      },
      alerts: {
        overdue: overdue,
        upcoming: upcoming,
        thisMonth: thisMonth
      }
    };

    console.log('✅ Maintenance stats calculated:', stats);

    return NextResponse.json(stats);

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 