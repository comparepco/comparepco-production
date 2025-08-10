export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'ADMIN_STAFF' | 'PARTNER' | 'PARTNER_STAFF' | 'DRIVER' | 'USER'

export interface User {
  id: string
  email: string
  phone?: string
  first_name: string
  last_name: string
  avatar?: string
  role: UserRole
  is_active: boolean
  is_verified: boolean
  created_at: string
  updated_at: string
}

export interface Partner {
  id: string
  user_id: string
  company_name: string
  business_type: string
  tax_id?: string
  address: string
  city: string
  state: string
  country: string
  postal_code: string
  phone: string
  website?: string
  description?: string
  logo?: string
  is_approved: boolean
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Driver {
  id: string
  user_id: string
  partner_id?: string
  license_number: string
  license_expiry: string
  insurance_number?: string
  insurance_expiry?: string
  experience: number
  rating: number
  total_trips: number
  total_earnings: number
  is_approved: boolean
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Vehicle {
  id: string
  partner_id: string
  driver_id?: string
  make: string
  model: string
  year: number
  license_plate: string
  vin: string
  color: string
  fuel_type: 'GASOLINE' | 'DIESEL' | 'ELECTRIC' | 'HYBRID' | 'PLUGIN_HYBRID'
  transmission: 'MANUAL' | 'AUTOMATIC' | 'CVT'
  seats: number
  doors: number
  mileage: number
  daily_rate: number
  weekly_rate?: number
  monthly_rate?: number
  is_available: boolean
  is_approved: boolean
  is_active: boolean
  features: string[]
  images: string[]
  created_at: string
  updated_at: string
}

export interface Booking {
  id: string
  user_id: string
  partner_id: string
  driver_id?: string
  vehicle_id: string
  start_date: string
  end_date: string
  total_days: number
  total_amount: number
  deposit?: number
  status: 'PENDING' | 'CONFIRMED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'REFUNDED'
  pickup_location: string
  dropoff_location?: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface Payment {
  id: string
  user_id: string
  partner_id?: string
  driver_id?: string
  booking_id?: string
  amount: number
  currency: string
  type: 'BOOKING_PAYMENT' | 'DEPOSIT' | 'REFUND' | 'COMMISSION' | 'BONUS' | 'FINE'
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'REFUNDED'
  method: 'CREDIT_CARD' | 'DEBIT_CARD' | 'BANK_TRANSFER' | 'CASH' | 'DIGITAL_WALLET'
  transaction_id?: string
  description?: string
  created_at: string
  updated_at: string
}

export interface Document {
  id: string
  user_id: string
  partner_id?: string
  driver_id?: string
  vehicle_id?: string
  type: 'LICENSE' | 'INSURANCE' | 'REGISTRATION' | 'INSPECTION' | 'CONTRACT' | 'ID_PROOF' | 'ADDRESS_PROOF' | 'BANK_STATEMENT' | 'TAX_DOCUMENT' | 'OTHER'
  name: string
  file_url: string
  file_size: number
  mime_type: string
  is_verified: boolean
  expires_at?: string
  created_at: string
  updated_at: string
}

export interface Claim {
  id: string
  user_id: string
  partner_id?: string
  driver_id?: string
  vehicle_id?: string
  booking_id?: string
  type: 'ACCIDENT' | 'DAMAGE' | 'THEFT' | 'MECHANICAL' | 'INSURANCE' | 'OTHER'
  title: string
  description: string
  amount?: number
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED' | 'REJECTED'
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  evidence: string[]
  created_at: string
  updated_at: string
}

export interface Notification {
  id: string
  user_id: string
  type: 'BOOKING_UPDATE' | 'PAYMENT_RECEIVED' | 'DOCUMENT_EXPIRY' | 'MAINTENANCE_DUE' | 'CLAIM_UPDATE' | 'SYSTEM_ALERT' | 'PROMOTION'
  title: string
  message: string
  is_read: boolean
  data?: any
  created_at: string
}

export interface Message {
  id: string
  sender_id: string
  receiver_id: string
  content: string
  type: 'TEXT' | 'IMAGE' | 'FILE' | 'SYSTEM'
  is_read: boolean
  created_at: string
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  total_pages: number
}

// Form types
export interface LoginForm {
  email: string
  password: string
}

export interface RegisterForm {
  email: string
  password: string
  confirm_password: string
  first_name: string
  last_name: string
  phone?: string
  role: UserRole
}

export interface ProfileForm {
  first_name: string
  last_name: string
  phone?: string
  avatar?: string
}

// Dashboard types
export interface DashboardStats {
  total_bookings: number
  total_revenue: number
  active_bookings: number
  pending_approvals: number
  total_vehicles: number
  total_drivers: number
  total_partners: number
  total_users: number
}

export interface ChartData {
  labels: string[]
  datasets: {
    label: string
    data: number[]
    background_color?: string
    border_color?: string
  }[]
}

// Filter types
export interface BookingFilters {
  status?: string
  date_range?: {
    start: string
    end: string
  }
  partner_id?: string
  driver_id?: string
  vehicle_id?: string
}

export interface VehicleFilters {
  make?: string
  model?: string
  fuel_type?: string
  transmission?: string
  is_available?: boolean
  is_approved?: boolean
}

export interface DriverFilters {
  is_approved?: boolean
  is_active?: boolean
  partner_id?: string
  experience?: number
  rating?: number
} 