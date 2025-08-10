import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const partnerId = searchParams.get('partnerId');

    if (!partnerId) {
      return NextResponse.json(
        { error: 'Partner ID is required' },
        { status: 400 }
      );
    }

    // Fetch partner information
    const { data: partner, error: partnerError } = await supabaseAdmin
      .from('partners')
      .select('*')
      .eq('id', partnerId)
      .single();

    if (partnerError) {
      console.error('Error fetching partner:', partnerError);
      return NextResponse.json(
        { error: 'Failed to fetch partner information' },
        { status: 500 }
      );
    }

    if (!partner) {
      return NextResponse.json(
        { error: 'Partner not found' },
        { status: 404 }
      );
    }

    // Transform the data to match the frontend interface
    const transformedPartner = {
      id: partner.id,
      companyName: partner.company_name,
      businessType: partner.business_type,
      taxId: partner.tax_id,
      address: partner.address,
      city: partner.city,
      state: partner.state,
      country: partner.country,
      postalCode: partner.postal_code,
      phone: partner.phone,
      website: partner.website,
      description: partner.description,
      logo: partner.logo,
      isApproved: partner.is_approved,
      isActive: partner.is_active,
      createdAt: partner.created_at,
      updatedAt: partner.updated_at,
      // Additional fields from registration
      contactName: partner.contact_name,
      email: partner.email,
      registrationNumber: partner.registration_number,
      vatNumber: partner.vat_number,
      operatingAreas: partner.operating_areas,
      vehicleTypes: partner.vehicle_types,
      fleetSize: partner.fleet_size,
      estimatedMonthlyRides: partner.estimated_monthly_rides,
      commissionRate: partner.commission_rate,
      documents: partner.documents
    };

    return NextResponse.json({
      partner: transformedPartner
    });

  } catch (error) {
    console.error('Error in get-partner-info:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 