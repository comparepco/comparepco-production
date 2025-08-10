import { supabase } from './client'
import { Database } from './types'

export type SupabaseCar = Database['public']['Tables']['cars']['Row']
export type SavedCar = Database['public']['Tables']['saved_cars']['Row']
export type Booking = Database['public']['Tables']['bookings']['Row']
export type User = Database['public']['Tables']['users']['Row']

// Define the Car interface here to avoid circular imports
export interface ComponentCar {
  id: string;
  partnerId?: string;
  driverId?: string;
  name: string;
  make: string;
  model: string;
  year?: number;
  licensePlate?: string;
  vin?: string;
  color?: string;
  fuelType?: string;
  transmission?: string;
  mileage?: number;
  pricePerWeek: number;
  salePricePerWeek?: number;
  imageUrl?: string;
  imageUrls?: string[];
  images?: string[];
  features?: string[];
  status?: string;
  insuranceIncluded?: boolean;
  location?: string;
  description?: string;
  category?: string;
  createdAt?: string;
  updatedAt?: string;
  pricing?: {
    minTermMonths?: number;
    depositRequired?: boolean;
    depositAmount?: number;
  };
}

// Mapping function to convert Supabase vehicle data to component interface
export function convertSupabaseVehicleToComponentCar(supabaseVehicle: any): ComponentCar {
  const pricing = supabaseVehicle.pricing || {};
  
  return {
    id: supabaseVehicle.id,
    partnerId: supabaseVehicle.partner_id,
    driverId: supabaseVehicle.driver_id,
    name: supabaseVehicle.name || '',
    make: supabaseVehicle.make || '',
    model: supabaseVehicle.model || '',
    year: supabaseVehicle.year || 0,
    licensePlate: supabaseVehicle.license_plate || '',
    vin: supabaseVehicle.vin || '',
    color: supabaseVehicle.color || '',
    fuelType: supabaseVehicle.fuel_type || '',
    transmission: supabaseVehicle.transmission || '',
    mileage: supabaseVehicle.mileage || 0,
    pricePerWeek: (supabaseVehicle.price_per_day || 0) * 7, // Convert daily rate to weekly
    salePricePerWeek: supabaseVehicle.price_per_day ? supabaseVehicle.price_per_day * 7 : undefined,
    features: supabaseVehicle.features || [],
    images: supabaseVehicle.images || [],
    status: supabaseVehicle.status || 'pending',
    insuranceIncluded: supabaseVehicle.insurance_included || undefined,
    location: supabaseVehicle.location || '',
    description: supabaseVehicle.description || '',
    category: supabaseVehicle.category || undefined,
    createdAt: supabaseVehicle.created_at,
    updatedAt: supabaseVehicle.updated_at,
    pricing
  };
}

// Car operations
export const getCars = async (): Promise<ComponentCar[]> => {
  const { data, error } = await supabase
    .from('vehicles')
    .select('*')
    .eq('is_active', true)
    .eq('is_approved', true)
    .eq('visible_on_platform', true)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data.map(convertSupabaseVehicleToComponentCar)
}

export const getCarById = async (id: string): Promise<ComponentCar> => {
  const { data, error } = await supabase
    .from('vehicles')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return convertSupabaseVehicleToComponentCar(data)
}

// Saved cars operations
export const getSavedCars = async (userId: string) => {
  const { data, error } = await supabase
    .from('saved_cars')
    .select(`
      *,
      vehicles (*)
    `)
    .eq('user_id', userId)

  if (error) throw error
  return data
}

export const saveCar = async (userId: string, carId: string) => {
  const { error } = await supabase
    .from('saved_cars')
    .insert({
      user_id: userId,
      car_id: carId,
      saved_at: new Date().toISOString()
    })

  if (error) throw error
}

export const unsaveCar = async (userId: string, carId: string) => {
  const { error } = await supabase
    .from('saved_cars')
    .delete()
    .eq('user_id', userId)
    .eq('car_id', carId)

  if (error) throw error
}

export const isCarSaved = async (userId: string, carId: string) => {
  const { data, error } = await supabase
    .from('saved_cars')
    .select('*')
    .eq('user_id', userId)
    .eq('car_id', carId)
    .single()

  if (error && error.code !== 'PGRST116') throw error
  return !!data
}

// Booking operations
export const createBooking = async (booking: Database['public']['Tables']['bookings']['Insert']) => {
  const { data, error } = await supabase
    .from('bookings')
    .insert(booking)
    .select()
    .single()

  if (error) throw error
  return data
}

export const getUserBookings = async (userId: string) => {
  const { data, error } = await supabase
    .from('bookings')
    .select(`
      *,
      cars (*)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

// User operations
export const getUserProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) throw error
  return data
}

export const updateUserProfile = async (userId: string, updates: Database['public']['Tables']['users']['Update']) => {
  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', userId)
    .select()
    .single()

  if (error) throw error
  return data
}

// Partner operations
export const getPartnerData = async (partnerId: string) => {
  const { data, error } = await supabase
    .from('partners')
    .select('*')
    .eq('id', partnerId)
    .single()

  if (error) throw error
  return data
}

export const getPartnerFleet = async (partnerId: string) => {
  const { data, error } = await supabase
    .from('vehicles')
    .select('*')
    .eq('partner_id', partnerId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export const getPartnerDrivers = async (partnerId: string) => {
  const { data, error } = await supabase
    .from('drivers')
    .select('*')
    .eq('partner_id', partnerId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

// Driver operations
export const getDriverData = async (driverId: string) => {
  const { data, error } = await supabase
    .from('drivers')
    .select('*')
    .eq('id', driverId)
    .single()

  if (error) throw error
  return data
}

export const getDriverTrips = async (driverId: string) => {
  const { data, error } = await supabase
    .from('bookings')
    .select(`
      *,
      vehicles (*)
    `)
    .eq('driver_id', driverId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

// Analytics operations
export const getBookingAnalytics = async (partnerId?: string) => {
  let query = supabase
    .from('bookings')
    .select('*')

  if (partnerId) {
    query = query.eq('partner_id', partnerId)
  }

  const { data, error } = await query

  if (error) throw error
  return data
}

export const getRevenueAnalytics = async (partnerId?: string) => {
  let query = supabase
    .from('bookings')
    .select('total_amount, created_at')

  if (partnerId) {
    query = query.eq('partner_id', partnerId)
  }

  const { data, error } = await query

  if (error) throw error
  return data
} 