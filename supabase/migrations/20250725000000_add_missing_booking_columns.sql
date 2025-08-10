-- Migration: Add missing columns to bookings table for full compatibility
ALTER TABLE public.bookings
  -- ADD COLUMN IF NOT EXISTS driver_id UUID REFERENCES public.drivers(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS pickup_location TEXT,
  ADD COLUMN IF NOT EXISTS dropoff_location TEXT,
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS deposit NUMERIC,
  ADD COLUMN IF NOT EXISTS total_days INTEGER; 