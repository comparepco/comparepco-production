import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    // First try to fetch with partners join
    let { data: vehicles, error } = await supabase
      .from('vehicles')
      .select(`
        *,
        partners (
          id,
          company_name,
          email
        )
      `)
      .eq('is_active', true)
      .eq('is_approved', true)
      .eq('visible_on_platform', true)
      .order('created_at', { ascending: false });

    // If that fails, try without the partners join
    if (error && error.message.includes('relationship')) {
      console.log('API: Retrying without partners join...');
      const { data: simpleVehicles, error: simpleError } = await supabase
        .from('vehicles')
        .select('*')
        .eq('is_active', true)
        .eq('is_approved', true)
        .eq('visible_on_platform', true)
        .order('created_at', { ascending: false });

      if (simpleError) {
        console.error('Error fetching available cars:', simpleError);
        return NextResponse.json(
          { success: false, error: 'Failed to fetch cars' },
          { status: 500 }
        );
      }

      vehicles = simpleVehicles;
      error = null;
    } else if (error) {
      console.error('Error fetching available cars:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch cars' },
        { status: 500 }
      );
    }

    // Transform vehicles to car format with proper tag data
    const cars = (vehicles || []).map(vehicle => {
      // Extract pricing data from JSONB
      const pricing = vehicle.pricing || {};
      const minTermMonths = pricing.min_term_months || 1;
      const depositRequired = pricing.deposit_required || false;
      const depositAmount = pricing.deposit_amount || 0;

      return {
        id: vehicle.id,
        name: vehicle.name || `${vehicle.make} ${vehicle.model}`,
        make: vehicle.make,
        model: vehicle.model,
        pricePerWeek: (vehicle.price_per_day || 0) * 7, // Convert daily rate to weekly with fallback
        salePricePerWeek: vehicle.sale_price_per_day ? vehicle.sale_price_per_day * 7 : undefined,
        imageUrl: vehicle.image_urls?.[0] || '/hero-car.png', // Use first image or default
        imageUrls: vehicle.image_urls || [],
        category: vehicle.category,
        fuelType: vehicle.fuel_type,
        partnerId: vehicle.partner_id,
        partnerName: vehicle.partners?.company_name || 'Partner', // Fallback if no partners join
        description: vehicle.description,
        specifications: {
          year: vehicle.year || 2024,
          mileage: vehicle.mileage || 0,
          transmission: vehicle.transmission || 'Automatic',
          doors: vehicle.doors || 4,
          seats: vehicle.seats || 5
        },
        availability: vehicle.is_available,
        features: vehicle.features || [],
        valueScore: vehicle.value_score || 0,
        isPopular: vehicle.is_popular || false,
        // Tag data
        insuranceIncluded: vehicle.insurance_included || false,
        pricing: {
          minTermMonths: minTermMonths,
          depositRequired: depositRequired,
          depositAmount: depositAmount
        },
        status: vehicle.is_approved ? 'active' : 'pending'
      };
    });

    return NextResponse.json({
      success: true,
      cars: cars
    });

  } catch (error) {
    console.error('Error in available cars API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
} 