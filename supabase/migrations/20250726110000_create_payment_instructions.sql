-- Create payment_instructions table for partner payments tracking
CREATE TABLE IF NOT EXISTS public.payment_instructions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  driver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  driver_name TEXT,
  vehicle_reg TEXT,
  amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  method TEXT CHECK (method IN ('bank_transfer','direct_debit')) NOT NULL DEFAULT 'bank_transfer',
  frequency TEXT CHECK (frequency IN ('weekly','one_off')) NOT NULL DEFAULT 'weekly',
  type TEXT CHECK (type IN ('weekly_rent','deposit','refund','topup','adjustment')) NOT NULL DEFAULT 'weekly_rent',
  next_due_date DATE,
  status TEXT CHECK (status IN ('pending','sent','auto','void','deposit_pending','deposit_refund_pending','deposit_refunded','deposit_received')) NOT NULL DEFAULT 'pending',
  last_sent_at TIMESTAMPTZ,
  refunded_amount NUMERIC(12,2),
  reason TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add commonly used indexes
CREATE INDEX IF NOT EXISTS idx_payment_instructions_partner ON public.payment_instructions(partner_id);
CREATE INDEX IF NOT EXISTS idx_payment_instructions_driver ON public.payment_instructions(driver_id);
CREATE INDEX IF NOT EXISTS idx_payment_instructions_booking ON public.payment_instructions(booking_id);
CREATE INDEX IF NOT EXISTS idx_payment_instructions_status ON public.payment_instructions(status);
CREATE INDEX IF NOT EXISTS idx_payment_instructions_next_due ON public.payment_instructions(next_due_date);

-- Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_payment_instructions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_payment_instructions_updated_at ON public.payment_instructions;
CREATE TRIGGER trg_update_payment_instructions_updated_at
  BEFORE UPDATE ON public.payment_instructions
  FOR EACH ROW
  EXECUTE FUNCTION update_payment_instructions_updated_at();

-- Enable Row Level Security
ALTER TABLE public.payment_instructions ENABLE ROW LEVEL SECURITY;

-- Allow partners to manage their own rows
CREATE POLICY "Partners can manage their payment instructions" ON public.payment_instructions
  USING (partner_id = (
    SELECT p.id FROM public.partners p WHERE p.id = partner_id AND (
      auth.uid() = p.user_id OR
      auth.uid() IN (SELECT ps.user_id FROM public.partner_staff ps WHERE ps.partner_id = p.id)
    )
  ))
  WITH CHECK (partner_id = (
    SELECT p.id FROM public.partners p WHERE p.id = partner_id AND (
      auth.uid() = p.user_id OR
      auth.uid() IN (SELECT ps.user_id FROM public.partner_staff ps WHERE ps.partner_id = p.id)
    )
  ));

-- Grant basic privileges to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payment_instructions TO authenticated; 

-- Aggregate helper: returns totals per status and sum amounts
CREATE OR REPLACE FUNCTION payment_instruction_stats(p_partner UUID)
RETURNS TABLE(
  total bigint,
  pending bigint,
  sent bigint,
  auto bigint,
  overdue bigint,
  total_amount numeric
) AS $$
BEGIN
  RETURN QUERY
    SELECT 
      COUNT(*) AS total,
      COUNT(*) FILTER (WHERE status = 'pending') AS pending,
      COUNT(*) FILTER (WHERE status = 'sent') AS sent,
      COUNT(*) FILTER (WHERE status = 'auto') AS auto,
      COUNT(*) FILTER (WHERE status = 'pending' AND next_due_date < CURRENT_DATE) AS overdue,
      COALESCE(SUM(amount),0) AS total_amount
    FROM public.payment_instructions
    WHERE partner_id = p_partner;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public; 